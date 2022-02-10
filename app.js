const express = require("express");
const CONFIG = require("./config");
const google = require("googleapis").google;
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const fs = require("fs");

const app = express();

app.set("view engine", "ejs");
app.set("views", __dirname);

app.use(cookieParser());

const OAuth2 = google.auth.OAuth2;

app.get("/", (req, res, next) => {
  const oauth2Client = new OAuth2(
    CONFIG.oauth2.client_id,
    CONFIG.oauth2.client_secret,
    CONFIG.oauth2.redirect_uris[0]
  );
  const loginLink = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: CONFIG.oauth2.scopes,
  });
  return res.render("index", { loginLink: loginLink });
});

app.get("/oauth2callback", (req, res, next) => {
  const oauth2Client = new OAuth2(
    CONFIG.oauth2.client_id,
    CONFIG.oauth2.client_secret,
    CONFIG.oauth2.redirect_uris[0]
  );
  if (req.query.error) {
    //auth failed
    return res.redirect("/");
  } else {
    oauth2Client.getToken(req.query.code, (err, token) => {
      if (err) {
        console.log(err);
        return res.redirect("/");
      }
      res.cookie("jwt", jwt.sign(token, CONFIG.JWTsecret));
      return res.redirect("/likes");
    });
  }
});

app.get("/likes", (req, res, next) => {
  if (!req.cookies.jwt) {
    return res.redirect("/");
  }
  const oauth2Client = new OAuth2(
    CONFIG.oauth2.client_id,
    CONFIG.oauth2.client_secret,
    CONFIG.oauth2.redirect_uris[0]
  );
  oauth2Client.credentials = jwt.verify(req.cookies.jwt, CONFIG.JWTsecret);
  //call the api
  const service = google.youtube("v3");
  //get user subs list
  service.videos
    .list({
      auth: oauth2Client,
      part: "snippet,contentDetails,statistics",
      myRating: "like",
      maxResults: 20,
    })
    .then((response) => {
      // console.log(response.data);
      return res.render("likes", { likes: response.data.items });
    });
});

app.get("/trends-for-you", (req, res, next) => {
  if (!req.cookies.jwt) {
    return res.redirect("/");
  }
  const oauth2Client = new OAuth2(
    CONFIG.oauth2.client_id,
    CONFIG.oauth2.client_secret,
    CONFIG.oauth2.redirect_uris[0]
  );
  //get videos from model
  oauth2Client.credentials = jwt.verify(req.cookies.jwt, CONFIG.JWTsecret);
  //call the api
  const service = google.youtube("v3");
  //get user subs list
  return res.render("trends-for-you", 
  // { playlistId: response.data.id }
  );

  // service.playlists
  //   .insert({
  //     auth: oauth2Client,
  //     part: "id,snippet,status",
  //     resource: {
  //       snippet: {
  //         title: `Trends For You ${new Date().toLocaleString()}`,
  //         defaultLanguage: "en",
  //       },
  //       status:{
  //         privacyStatus:"unlisted"
  //       }
  //     },
  //   })
  //   .then((response) => {
  //     if (response) {
  //       console.log(response.data.id);
  //       let rawdata = fs.readFileSync('likes.json');
  //       let videos = JSON.parse(rawdata);
  //       addToPlaylist(service,oauth2Client, videos, response.data.id,0)
  //       .then((response2) => {
  //         if (response2){
  //           return res.render("trends-for-you", { playlistId: response.data.id });
  //         }
  //       })
  //     }
  //   })
  //   .catch((error) => console.log(error));
});

async function addToPlaylist(service, auth, videos, playlistId, count) {
  service.playlistItems
    .insert({
      auth: auth,
      part: "snippet",
      resource: {
        snippet: {
          playlistId: playlistId,
          resourceId: {
            videoId: videos[count] ? videos[count] : "QRiQXCkw3rs",
            kind: "youtube#video",
          },
        },
      },
    })
    .then((response) => {
      if (response) {
        console.log(count, videos.length);
        if (count < videos.length) {
          count++;
          addToPlaylist(service, auth, videos, playlistId, count);
        } else {
          console.log("else girdi");
        }
      }
    });
}
app.get("/likes-json", (req, res, next) => {
  if (!req.cookies.jwt) {
    return res.redirect("/");
  }
  const oauth2Client = new OAuth2(
    CONFIG.oauth2.client_id,
    CONFIG.oauth2.client_secret,
    CONFIG.oauth2.redirect_uris[0]
  );
  oauth2Client.credentials = jwt.verify(req.cookies.jwt, CONFIG.JWTsecret);
  //call the api
  const service = google.youtube("v3");
  //get user subs list
  service.videos
    .list({
      auth: oauth2Client,
      part: "snippet,contentDetails,statistics",
      myRating: "like",
      maxResults: 20,
    })
    .then((response) => {
      console.log(response.data);
      return res.send(response.data.items);
    });
});

app.get("/trends", (req, res, next) => {
  if (!req.cookies.jwt) {
    return res.redirect("/");
  }
  const oauth2Client = new OAuth2(
    CONFIG.oauth2.client_id,
    CONFIG.oauth2.client_secret,
    CONFIG.oauth2.redirect_uris[0]
  );
  oauth2Client.credentials = jwt.verify(req.cookies.jwt, CONFIG.JWTsecret);
  //call the api
  const service = google.youtube({
    version: "v3",
    auth: "AIzaSyAZReNu5EjDiEHyz01JwAW-obU_kYBdrjU",
  });
  //get user subs list

  service.videos
    .list({
      part: "snippet,contentDetails,statistics",
      chart: "mostPopular",
      regionCode: "GB",
      maxResults: 250,
    })
    .then((response) => {
      console.log(response.data);
      return res.render("trends", { trends: response.data.items });
    });
});
app.listen(5000, () => {
  console.log("app running");
});

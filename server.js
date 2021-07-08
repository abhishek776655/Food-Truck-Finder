const express = require("express");
const axios = require("axios");
const NodeGeocoder = require("node-geocoder");
const app = express();
const port = 5000;

const options = {
  provider: "locationiq",
  apiKey: "pk.00c07bd0b913c2c9fb7b4a4218c7cc02",
  formatter: null,
};
const geocoder = NodeGeocoder(options);
var bodyParser = require("body-parser");
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Route
app.get("/", async (req, res, next) => {
  console.log(req.query);
  if (!req.query.latitude && req.query.address === "") {
    res.send({
      isError: true,
      message: "provide address or location",
      path: "params",
    });
    return;
  }
  console.log("ran");
  if (
    req.query &&
    req.query.latitude != undefined &&
    req.query.longitude != undefined
  ) {
    const request = {
      maxLat: parseFloat(req.query.latitude) + 0.1,
      minLat: parseFloat(req.query.latitude) - 0.1,
      maxLong: parseFloat(req.query.longitude) + 0.1,
      minLong: parseFloat(req.query.longitude) - 0.1,
    };
    console.log(request);
    axios
      .get(
        `https://data.sfgov.org/resource/rqzj-sfat.json?$limit=10&$where=latitude < ${request.maxLat} AND longitude < ${request.maxLong} AND latitude > ${request.minLat} AND longitude > ${request.minLong} `
      )
      .then((r) => {
        console.log(r.data);
        if (r.data.length === 0) {
          res.send({
            isError: true,
            message: "No trucks around this location",
            path: "Empty",
            addressData: false,
            coordinates: {
              latitude: parseFloat(req.query.latitude),
              longitude: parseFloat(req.query.longitude),
            },
          });
          return;
        }
        res.send({
          isError: false,
          data: r.data,
          addressData: false,
          coordinates: {
            latitude: parseFloat(req.query.latitude),
            longitude: parseFloat(req.query.longitude),
          },
        });
      })
      .catch((e) => console.log(e));
  }

  geocoder
    .geocode({
      limit: 5,
      address: req.query.address,
    })
    .then((response) => {
      if (response.length === 0) {
        res.send({ isError: True, error: e });
        return;
      }
      const request = {
        maxLat: response[0].latitude + 0.5,
        minLat: response[0].latitude - 0.5,
        maxLong: response[0].longitude + 0.5,
        minLong: response[0].longitude - 0.5,
      };
      console.log(request);
      axios
        .get(
          `https://data.sfgov.org/resource/rqzj-sfat.json?$limit=10&$where=latitude < ${request.maxLat} AND longitude < ${request.maxLong} AND latitude > ${request.minLat} AND longitude > ${request.minLong} `
        )
        .then((r) => {
          console.log(r.data);
          if (r.data.length == 0) {
            res.json({
              isError: true,
              message: "No trucks around this location",
              path: "Empty",
            });
          }
          res.json({
            isError: false,
            data: r.data,
            addressData: true,
            coordinates: {
              latitude: response[0].latitude,
              longitude: response[0].longitude,
            },
          });
        })
        .catch((e) => res.send(e));
    })
    .catch((e) => {
      res.send(e);
    });
});

// Server Initialization
app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});

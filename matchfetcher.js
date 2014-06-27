var express = require("express");
var fs = require("fs");
var path = require("path");
var request = require("request");
var cheerio = require("cheerio");
var _ = require("underscore");

var scorefetcher = require("./scorefetcher");

// MATCH CHECKER
// Every hour, checks whether a match is in progress
// If match is in progress, runs score fetcher every 10 seconds for 2.5 hours

// Production values:
// var scoreCheck_freq = 1000 * 10; // Scrape every ten seconds
// var match_length = 1000 * 60 * 60 * 2.5; // Keep scraper running for 2.5 hours
// var ping_interval = 1000 * 60; // Check for matches every hour

// Test values:
var scoreCheck_freq = 1000 * 10;
var match_length = 1000 * 60 * 2.5;
var ping_interval = 1000 * 30;


var scraper = null;

var startScraper = function() {
  console.log("*********** SCRAPING ***********");
  scraper = setInterval(function() {
    scorefetcher.scrapeCurrent();
  }, scoreCheck_freq);
};

var endScraper = function() {
  setTimeout(function() {
    clearInterval(scraper);
    scraper = null;
    console.log("********************************");
  }, match_length);
};

var getMatches = function(file) {
  if (file) {
    fs.readFile(file, { encoding: "utf-8" }, function(error, data) {
      if(!error){
        var $ = cheerio.load(data);
        var matchesData = JSON.parse(data);
        checkMatchTimes(matchesData);
      } else {
        console.log(error);
      }
    });
  } else {
    request({
      url: "http://worldcup.sfg.io/matches/today",
      headers: {
        "User-Agent": "worldcupgolbot by @arghgr"
      }
    }, function(error, response, data){
      if(!error){
        var $ = cheerio.load(data);
        var matchesData = JSON.parse(data);
        checkMatchTimes(matchesData);
      } else {
        console.log(error);
      }
    });
  }

  var checkMatchTimes = function(matchesData) {
    var datetime = new Date();
    var date = datetime.toJSON().substr(0,10);
    var hour = (parseInt(datetime.toJSON().substr(11,13), 10)) - 3;
    console.log("date: " + date);
    console.log("hour: " + hour);
    if (matchesData.length > 0) {
      var doScrape = false;
      for (i = 0; i < matchesData.length; i++) {
        if (matchesData[i].datetime.length == 29) {
          var matchDate = matchesData[i].datetime.substr(0,10);
          var matchHour = parseInt(matchesData[i].datetime.substr(11,13), 10);
          console.log("matchDate: " + matchDate);
          console.log("matchHour: " + matchHour);
          if (date == matchDate && hour == matchHour) {
            console.log("game time");
            doScrape = true;
            break;
          }
        }
      }
      if (doScrape) {
        if (scraper) { clearInterval(scraper); }
        console.log("scraper started");
        startScraper();
        endScraper();
      }
    } else {
      console.log("matchesData is empty");
    }
  };
};

var checkIfMatch = function(file) {
  console.log("checking for scraping in progress");
  if (!scraper) {
    console.log("no scraping in progress - checking matches");
    if (file) { getMatches(file); } else { getMatches(); }
  } else {
    console.log("scraping already in progress");
  }
};

var testFile1 = path.join(__dirname + '/test_files/examplex_currentx.json');
var testFile2 = path.join(__dirname + '/test_files/examplex_currenty.json');

// RUN WITH TEST DATA AND SCRAPE SPEEDS
// getMatches(testFile2);
// var test = setInterval(function() {
//   checkIfMatch(testFile2);
// }, ping_interval);

// RUN WITH PRODUCTION DATA AND SCRAPE SPEEDS
var production = setInterval(function() {
  checkIfMatch();
}, ping_interval);
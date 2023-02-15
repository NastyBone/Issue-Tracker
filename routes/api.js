/*
 *
 *
 *       Complete the API routing below
 *
 *
 */
"use strict";

var expect = require("chai").expect;
var MongoClient = require("mongodb");
var ObjectId = require("mongodb").ObjectID;

const CONNECTION_STRING = process.env.DB_KEY;
module.exports = function(app) {
  MongoClient.connect(CONNECTION_STRING, function(err, db) {
    if (err) return "DATABASE_CONNECTION_ERROR" + err;
    if (db) console.log("Sucesfull connection!");
  });

  app
    .route("/api/issues/:project")

    .get(function(req, res) {
      var project = req.params.project;
      var obj = req.query;
      if(obj._id) obj._id = new ObjectId(obj._id)
      if (obj.open) { obj.open = String(obj.open) == "true" } 
    
      MongoClient.connect(CONNECTION_STRING, function(err, db) {
        db.collection(project).find(obj).toArray(function(err,docs){res.json(docs);
      
        });
      });
    })

    .post(function(req, res) {
      var project = req.params.project;
      var {
        issue_title,
        issue_text,
        created_by,
        assigned_to,
        status_text
      } = req.body;
    
  
      MongoClient.connect(CONNECTION_STRING, function(err, db) {
        var obj = {
          issue_title: issue_title,
          issue_text: issue_text,
          created_by: created_by,
          asigned_to: assigned_to || "",
          status_text: status_text || "",
          created_on: new Date(),
          updated_on: new Date(),
          open_issue: true
        };
          if (!obj.issue_text || !obj.issue_title || !obj.created_by) {res.text('missing inputs')}
        db.collection(project).insertOne(obj, (err, data) => {
          obj._id = data.insertedId;
          
          res.send(obj);
        });
      });
    })

    .put(function(req, res) {
      var project = req.params.project;
      var updates = req.body;
    
    for(var e in updates) {if (!updates[e]) { delete updates[e]}}
    
      MongoClient.connect(CONNECTION_STRING, function(err, db) {
        var error;
        
        try {
          updates._id = new ObjectId(updates._id);
          updates.updates_on = new Date()
        } catch (e) {
          error = e;
        }
           if(Object.keys(updates).length < 2) {res.text('No body')}
        db.collection(project).findAndModify(
          { _id: updates._id },
          {},
          {
            $set: updates
          },{upsert: true},
          
          (err, data) => {
      //      console.log(data.value);
    
            if (err || error) res.send("Could not update " + updates._id);
            else res.send("Sucessfully updated " + updates._id);
          }
        );
      });
    })

    .delete(function(req, res) {
      var project = req.params.project;
      var { _id } = req.body;
      var error;
  
      try {
        _id = new ObjectId(_id);
      } catch (e) {
        error = e;
      }
    
      MongoClient.connect(CONNECTION_STRING, function(err, db) {
        db.collection(project).findAndRemove({ _id: _id }, (err, data) => {
         // console.log(data);

          if (err || error || !data.lastErrorObject.n) res.send("Could not delete " + _id);
          else  res.send("Deleted " + _id);
        });
      });
    });
};

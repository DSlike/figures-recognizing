const express = require('express'),
      app = express(),
      brain = require('brain.js');

const net = new brain.NeuralNetwork();

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

var port = process.env.PORT || 3000;
app.listen(port, function() {
    console.log("Listening on " + port);
});

app.get("/", function(req, res){
    res.sendFile(__dirname+"/view/index.html");
});

app.get("/view/:folder/:file", function(req, res){
    res.sendFile(__dirname+"/view/"+req.params.folder+"/"+req.params.file);
})

app.get("/trainingMaterials/:file", function(req, res){
    res.sendFile(__dirname+"/trainingMaterials/"+req.params.file);
})

require(__dirname+"/controller/generate.js")(app, __dirname);
require(__dirname+"/controller/train.js")(app, __dirname);
require(__dirname+"/controller/recognize.js")(app, __dirname);

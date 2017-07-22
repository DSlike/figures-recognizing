const express = require('express'),
      app = express(),
      fs = require('fs')
      brain = require('brain.js');

module.exports = function(app, rootPath){
    app.get("/train", function(req, res){
        const net = new brain.NeuralNetwork();
        fs.readFile(rootPath+"/data/train.json", 'utf-8', function(err, trainData){
            net.train(
                JSON.parse(trainData), {
                    errorThresh: 0.01,
                    iterations: 500,
                    log: true,
                    logPeriod: 1,
                    learningRate: 0.03
                }
            );
            var data = net.toJSON();
            fs.writeFile(rootPath + "/NN/knowledge.json", JSON.stringify(data), function(err) {
                res.send("Done");
            })
        });
    });
}

const express = require('express'),
    app = express(),
    fs = require('graceful-fs'),
    brain = require('brain.js'),
    path = require("path"),
    Jimp = require("jimp"),
    getPixels = require("get-pixels"),
    formidable = require('formidable');

    var realFs = require('fs');
    var gracefulFs = require('graceful-fs');
    gracefulFs.gracefulify(realFs);

module.exports = function(app, rootPath) {
        app.post("/uploadImage", function(req, res) {
            var breakIt = 0;
            var name = Math.random().toString(36);
            var form = new formidable.IncomingForm();
            form.multiples = true;
            form.uploadDir = path.join(rootPath, '/uploads/');
            form.on('file', function(field, file) {
                fs.rename(file.path, path.join(form.uploadDir, name + ".png"));
                Jimp.read(rootPath + "/uploads/"+name+".png", function(err, file) {
                    file.contain(100,100)
                        .color([
                            { apply: 'hue', params: [ 0 ] },
                            { apply: 'brighten', params: [ 0 ] }
                        ])
                        .dither565()
                        // .convolute([
                        //     [ 0, 0, 0],
                        //     [ 0, 3, 0],
                        //     [ 0, 0, 0]
                        // ])
                        .grayscale()
                        .contrast(1)
                        .write(rootPath + "/uploads/"+name+".png", function(){
                            var rotatedFigure = file.clone();
                            if(breakIt==0){
                                for(var i=0; i<100; i+=20){
                                    for(var j=0; j<100; j+=20){
                                        var copy = rotatedFigure.clone();
                                        copy
                                            .crop(j,i,20,20)
                                            .write(rootPath + "/recognizing/"+name+"/_"+i+"_"+j+".png", function(){
                                                fs.readdir(rootPath+"/recognizing/"+name+"/", (err, files) => {
                                                    if(files.length==25){
                                                        recognize(name, function(data) {
                                                            if(breakIt==0){
                                                                res.send(data);
                                                            }
                                                            breakIt = 1;
                                                            return;
                                                        });
                                                    }
                                                });
                                            });
                                    }
                                }
                            }
                        });
                });
            });
            form.on('error', function(err) {
                console.log('An error has occured: \n' + err);
            });
            form.on('end', function() {

            });
            form.parse(req);
        });

        function recognize(name, callback) {
            var breakIt = 0;
            var recognizedFigure = {round:0, triangle:0 ,square:0};
            fs.readFile(rootPath+"/NN/knowledge.json", 'utf-8', function(err, knowledge){
                fs.readdir(rootPath+"/recognizing/"+name+"/", (err, files) => {
                    files.forEach(function(file, index){
                        getPixels(rootPath+"/recognizing/"+name+"/"+file, function(err, pixels) {
                            if(breakIt==1)
                                return;
                            var haveContent = 0;
                            var pixelsArray = [];
                            for(var i=0; i<pixels.data.length-4; i+=4){
                                if(breakIt==1)
                                    return;
                                if(((pixels.data[i]+pixels.data[i+1]+pixels.data[i+2])/3)<50 && pixels.data[i+3]>250){
                                    var color = (pixels.data[i]+pixels.data[i+1]+pixels.data[i+2])/3;
                                    pixelsArray.push(1);
                                    haveContent++;
                                }
                                else
                                    pixelsArray.push(0);
                                if(i == pixels.data.length-8 && haveContent>0 && haveContent<70 && breakIt==0){
                                    const net = new brain.NeuralNetwork();
                                    net.fromJSON(JSON.parse(knowledge));
                                    var output = net.run(pixelsArray);
                                    recognizedFigure.round += output.round;
                                    recognizedFigure.square += output.square;
                                    recognizedFigure.triangle += output.triangle;
                                    if(index>80 || recognizedFigure.square>1.0 || recognizedFigure.round>1.0 || recognizedFigure.triangle>1.0){
                                        if(recognizedFigure.round>recognizedFigure.square && recognizedFigure.round>recognizedFigure.triangle)
                                            recognizedFigure = "round";
                                        else if(recognizedFigure.square>recognizedFigure.round && recognizedFigure.square>recognizedFigure.triangle)
                                            recognizedFigure = "square";
                                        else if(recognizedFigure.triangle>recognizedFigure.square && recognizedFigure.triangle>recognizedFigure.round)
                                            recognizedFigure = "triangle";

                                        try{
                                            callback(recognizedFigure);
                                            breakIt=1;
                                            return;
                                        }
                                        catch(e){
                                            return;
                                        }
                                    }
                                }
                            }
                        });
                    });
                });
            });
        }
}

const express = require('express'),
      app = express(),
      fs = require('fs')
      Jimp = require("jimp"),
      getPixels = require("get-pixels");

var trainingMaterials = [];
const figures = ['square','triangle','round'];

fs.readdir("./trainingMaterials/", (err, files) => {
    files.forEach(function(file, index){
        trainingMaterials.push(file);
    })
});

module.exports = function(app, rootPath){
    app.get("/generate", function(req, res){
        var count=0;
        trainingMaterials.forEach(function(element, index){
            Jimp.read(rootPath + "/trainingMaterials/"+element+"", function(err, figure) {
                console.log(element);
                figure.color([
                    { apply: 'hue', params: [ 0 ] },
                    { apply: 'brighten', params: [ 0 ] }
                ])
                .dither565()
                .contain(100,100)
                .grayscale()
                .contrast(1);

                for(var invert=0; invert<2; invert++){
                    var rotatedFigure = figure.clone();
                    for(var i=0; i<100; i+=20){
                        for(var j=0; j<100; j+=20){
                            var copy = rotatedFigure.clone();
                            if(invert==1)
                                copy.invert();
                            const fileName = (element+"_a-"+invert+"_c-"+(i/20+"_"+j/20)).toString();
                            copy.crop(j,i,20,20)
                                .write(rootPath + "/temp/"+fileName+".png", function(){
                                });
                        }
                    }
                }
            });
        });
    });
    app.get("/generateTrainData", function(req, res){
        var saveData = [];
        fs.readdir(rootPath+"/temp/", (err, files) => {
            files.forEach(file => {
                var out = {};
                for(var i=0; i<figures.length; i++){
                    out[figures[i]]=0;
                }
                var line = file.indexOf("_", 0);
                var figure = file.substring(0,line);
                getPixels(rootPath + "/temp/"+file, function(err, pixels) {
                    var pixelsData = [],
                        haveContent = 0;
                    for(var i=0; i<pixels.data.length-4; i+=4){
                        var color = (pixels.data[i]+pixels.data[i+1]+pixels.data[i+2])/3;
                        if(color < 50 && pixels.data[i+3]>250){
                            pixelsData.push(1);
                            haveContent++;
                        }
                        else
                            pixelsData.push(0);
                        if(i == pixels.data.length-8 && haveContent>0 && haveContent<70){
                            out[figure]=1;
                            saveData.push({input:pixelsData, output:out});
                            fs.exists(rootPath+"/data/train.json", (exists) => {
                              if (exists) {
                                    fs.readFile(rootPath+"/data/train.json", "utf-8", function(err, data){
                                        data = JSON.parse(data);
                                        console.log(data);
                                        data.push(saveData);
                                        fs.writeFile(rootPath+"/data/"+figure+".json", JSON.stringify(data), function(err){
                                            if(!err)
                                                console.log("done");
                                            else {
                                                console.log(err);
                                            }
                                        })
                                    });
                                }
                                else{
                                    fs.writeFile(rootPath+"/data/train.json", JSON.stringify(saveData), function(err){
                                        if(!err)
                                            console.log("done");
                                        else {
                                            console.log(err);
                                        }
                                    })
                                }
                            });
                        }
                    }
                });
            });
        })
    });
}

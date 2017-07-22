$("document").ready(function() {
    $("button.generate").click(function() {
        $.get("/generate", function(data) {})
    });
    $("button.generate-train").click(function() {
        $.get("/generateTrainData", function(data) {})
    });
    $("button.train").click(function() {
        $.get("/train", function(data) {
            console.log(data);
        })
    });
    $("input[type=file]").change(function() {
        files = $(this).get(0).files;
        if (files.length > 0) {
            var start = Date.now();
            var formData = new FormData();
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                formData.append('uploads[]', file, file.name);
            }
            const self = this;
            var l = JSON.stringify(localStorage);
            $.ajax({
                url: '/uploadImage',
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                cache: false,
                success: function(data) {
                    $(".log").prepend("<span>It's - "+data+". Recognized for - "+parseInt(Date.now()-start)+" ms</span>");
                },
                xhr: function() {
                    var xhr = new XMLHttpRequest();
                    xhr.upload.addEventListener('progress', function(evt) {
                        if (evt.lengthComputable) {
                            var percentComplete = evt.loaded / evt.total;
                            percentComplete = parseInt(percentComplete * 100);
                            percentComplete = parseInt(75 * percentComplete / 100) + 25;
                            console.log(percentComplete);
                        }
                    }, false);
                    xhr.upload.addEventListener('load', function(e) {
                        // window.location.replace("/videoEdit");
                        console.log("uploaded")
                    });
                    return xhr;
                }
            });
        }
    });
});

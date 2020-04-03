// This is the initialization loading the CryptPad libraries
define([
    'jquery',
    '/bower_components/nthen/index.js',
    '/common/sframe-common.js',
    '/common/sframe-app-framework.js',
    '/common/common-util.js',
    '/common/common-hash.js',
    '/common/modes.js',
    '/customize/messages.js',
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/seiyria-bootstrap-slider/dist/bootstrap-slider.js',
    '/bower_components/tweetnacl/nacl-fast.min.js',
    'css!/bower_components/seiyria-bootstrap-slider/dist/css/bootstrap-slider.css',
    'less!/meet/app.less'
    /* Here you can add your own javascript or css to load */
], function (
    $,
    nThen,
    SFCommon,
    Framework,
    Util,
    Hash,
    Modes,
    Messages,
    Crypto,
    Slider) {


    var Nacl = window.nacl;
    var videoWC;
    var videoEncryptor;
    var counter = 0;
    var videoCodec = 'video/webm; codecs="vp8"';
    var audioCodec = 'audio/webm; codecs="opus"';
    var options = { "video" : { videoBitsPerSecond : 500000, mimeType : videoCodec }, "audio" : { audioBitsPerSecond : 64000, mimeType : audioCodec }}
    var remoteVideo = document.querySelector('#remotevideo');
    var remoteAudio = document.querySelector('#remoteaudio');
    var currentBitRate = 3;
    var maxBitRate = 3;
    var video = document.querySelector('#ownvideo');
    var stream = { "audio" : "", "video" : ""};
    var sendingDropped = { "audio" : 0, "video" : 0};
    var remoteDropped = { "audio" : 0, "video" : 0};
    var stream = { "audio" : "", "video" : ""};
    var lastStats = { "audio" : 0, "video" : 0};
    var mediaSending = false;
    var audioSendQueue = [];
    var videoSendQueue = [];
    var screenSharingActive = false;
    var packetDuration = 300;

    const videoConstraints = {video: { width: 1024, height: 576 } };
    const screenSharingConstraints = { video: { width: 1024, height: 576, mediaSource: 'screen'}};
    const audioConstraints = { audio: true };
    var maxStatsSize = 10;
    var stats = {};
    const average = arr => arr.reduce((a,b) => a + b, 0) / arr.length

    /*
      Managing Video Quality Bitrate
    */
    var qualityValues = [50, 100, 250, 500, 1000, 5000, 10000, 25000, 50000];
    $("#quality-bitrate").text("" + Math.floor(options["video"].videoBitsPerSecond/1000) + "kbits/sec")
    $("#quality").slider({
      id: "quality",
      value: maxBitRate,
      min: 0,
      max: 8,
      formatter: function(value) {
        return "" + value + "kbits/sec";
      }   
    }).on('change', function(event) {
      console.log("Slider value: " + event.value.newValue);
      maxBitRate = event.value.newValue;
      currentBitRate = maxBitRate;
      setBitRate(maxBitRate, true);
    });

    function setBitRate(bitRateId, display) {
      var val = qualityValues[bitRateId];
      if (display)
          $("#quality-bitrate").text("" + val + "kbits/sec");
      options["video"].videoBitsPerSecond = val*1000;
    }

    var waitChange = 0;
    function increaseBitRate() {
        if (waitChange>0) {
           waitChange--;
        } else if (currentBitRate<maxBitRate) {
           currentBitRate++;
           setBitRate(currentBitRate, false);
           console.log("INCREASE BIT RATE TO " + qualityValues[currentBitRate] + "kbits/sec")
           waitChange = 20;
        }
    }

    function decreaseBitRate() {
        if (waitChange>0) {
           waitChange--;
        } else if (currentBitRate>0) {
           currentBitRate--;
           setBitRate(currentBitRate, false);
           console.log("DECREASE BIT RATE TO " + qualityValues[currentBitRate] + "kbits/sec")
           waitChange = 20;
        }
    }

    /*
     Gathering statistics
    */
    function addStats(id, type, value) {
       var key = id + "-" + type;
       var statsItem = stats[key]
       if (statsItem==null) {
         stats[key] = statsItem = [];
       }
       if (statsItem.length>=maxStatsSize) 
        statsItem.shift()
       statsItem.push(value);
       // Update the stats
       var val = average(statsItem);
       val = Math.floor(val);
       $("#cp-stats-" + key).text("" + val + "ms");
       if (id=="remote")
         lastStats[type] = val;
    }

    function addSendingDropped(type, nb) {
        sendingDropped[type] = sendingDropped[type] + nb;
        $("#cp-dropped-sending-" + type).text(sendingDropped[type])
    }
    function addRemoteDropped(id, type, nb) {
        remoteDropped[type] = remoteDropped[type] + nb;
        $("#cp-dropped-remote-" + type).text(remoteDropped[type])
    }


    /*
      Secret keys for the video channel
      TODO: generate a new secret key or use the secret key of the current pad
    */
    var hash = "/2/meet/edit/6Hwli0F5AsLHzhRenu412SNP/"; // Hash.createRandomHash('meet');
    var secret = Hash.getSecrets('meet', hash);
    secret.keys.signKey = "";

    /*
      MediaSource management
    */
    var mediaSource = new MediaSource();
    var audioSourceBuffer;
    var videoSourceBuffer;
    mediaSource.addEventListener('sourceopen', function() { 
      console.log("Remote video source open")
        
      videoSourceBuffer = mediaSource.addSourceBuffer(videoCodec);
      window.videoSourceBuffer = videoSourceBuffer;
      videoSourceBuffer.mode = "sequence";
    }, false);
    mediaSource.addEventListener('error', function (e) {
       console.log("error", e)
    }, false);
    remoteVideo.src = window.URL.createObjectURL(mediaSource);


    var audioSource = new MediaSource();
    audioSource.addEventListener('sourceopen', function() { 
      console.log("Remote audio source open")
      audioSourceBuffer = audioSource.addSourceBuffer(audioCodec);
      window.audioSourceBuffer = audioSourceBuffer;
      audioSourceBuffer.mode = "sequence";
    }, false);
    remoteAudio.src = window.URL.createObjectURL(audioSource);
    /*
    var audioCtx = new window.AudioContext()
    var channels = 1
    var sampleRate = 44100
    var frames = sampleRate * 3
    var buffer = audioCtx.createBuffer(channels, frames, sampleRate)
    var audioSourceBuffer = audioCtx.createBufferSource();
    */

    /*
      Display user name on own video
    */
    function updateUserName() {
      var pdata = framework._.sfCommon.getMetadataMgr().getPrivateData()
      $("#cp-app-meet-own-name").text(pdata.accountName + " (me)");
    }


    /*
     Setup a new remote user
    */
    function checkRemoteUser(clientId) {
      var remoteUserDoc = $("#cp-app-meet-remote" + clientId);
      if (remoteUserDoc[0]) {
        return remoteUserDoc;
      }

      var html = "<div id='cp-app-meet-remote' class='cp-app-meet-video col-sm-6'> \
                            <div id='cp-app-meet-video-remote' class='cp-app-meet-video-element'> \
                                <div class='cp-app-remote-stats'> \
                                    <span id='cp-app-meet-remote-name' class='cp-app-meet-remote-name'></span> \
                                    <span id='cp-stats-remote-video' class='cp-app-stats-item'></span> \
                                    <span id='cp-stats-remote-audio' class='cp-app-stats-item'></span> \
                                    <span id='cp-stats-remote-receive-video' class='cp-app-stats-item'></span> \
                                    <span id='cp-stats-remote-receive-audio' class='cp-app-stats-item'></span> \
                                    <span id='cp-kbits-remote-video' class='cp-app-stats-item'></span> \
                                    <span id='cp-kbits-remote-audio' class='cp-app-stats-item'></span> \
                                    <span id='cp-dropped-remote-video' class='cp-app-stats-item'></span> \
                                    <span id='cp-dropped-remote-audio' class='cp-app-stats-item'></span> \
                                </div> \
                                <video id='remotevideo' width='1024' height='576' autoplay></video> \
                                <audio id='remoteaudio' autoplay></audio> \
                            </div> \
                </div>";
       var remoteUserHTML = html.replace("remote", "remote" + clientId);
       console.log(remoteUserHTML)
       $(remoteUserHTML).insertAfter($("#cp-app-meet-own"));
       return $("#cp-app-meet-remote" + clientId);
    }


    /*
      Recoding and transmission
    */
    var record = (stream, options, ms) => {
      /*
      console.log(stream);
      var tracks = stream.getAudioTracks();
      console.log(tracks);
      if (tracks && tracks.length>0)
        console.log(tracks[0].getSettings())
      */
      var rec = new MediaRecorder(stream, options), data = [];
      rec.ondataavailable = e => data.push(e.data);
      rec.start(ms);
      log(rec.state + " for "+ (ms / 1000) +" seconds.");
      var stopped = new Promise((r, e) => (rec.onstop = r, rec.onerror = e));
      return Promise.all([stopped, wait(ms).then(() => rec.stop())])
      .then(() => { return data });
    };

    var stop = stream => stream.getTracks().forEach(track => track.stop());
    var wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    var log = msg => console.log(msg);
    var failed = e => log(e.name +", line "+ e.lineNumber);

    function ab2str(buf) {
      return Nacl.util.encodeBase64(buf);
    }
    function str2ab(str) {
      return Nacl.util.decodeBase64(str);
    }

    function sendMessage(msg) {
        mediaSending = true;
        var startTime = msg.startTime;
        var cmsg = Crypto.encrypt(JSON.stringify(msg), secret.keys.cryptKey)
        videoWC.bcast(cmsg).then(function () {
                    mediaSending = false;
                    var sendTime = Date.now();
                    var duration = sendTime - startTime;
                    addStats("sending", msg.type, duration);
                    msg.sendTime = sendTime;
                    console.log("Sending " + msg.type + " done " + msg.counter + " time: " + duration + "ms");
                    if (msg.type=="video") {
                      if (duration>2000) {
                          decreaseBitRate();
                      } else if (duration<600) {
                          increaseBitRate();
                      }
                    }
                    if (mediaSending)
                      addSendingDelayed(msg.type);
                    else
                      emptyQueue();
        }, function (err) {
                    console.log("Sending video recording ERROR");
                    mediaSending = false;
                    emptyVideoQueue();
        }); 
    }

    function emptyQueue() {
        if (audioSendQueue.length==0 && videoSendQueue.length==0)
          return;
        if (mediaSending) {
          console.log("Video sending channel not ready. Waiting");
          return;
        }
        if (audioSendQueue.length>0) {
          var msg = audioSendQueue.shift();
          sendMessage(msg);
        } else if (videoSendQueue.length>0) {
          var msg = videoSendQueue.shift();
          sendMessage(msg);
        }
    }

    function sendStream(stream, type) {        
        var startTime = Date.now();
        record(stream, options[type], packetDuration).then(recording => {
          var prepareTime = Date.now();
          var duration = prepareTime - startTime;       

          // stop(stream);
          var fr = new FileReader();
          var arrayBuffer;
           fr.onload = function(event) {
             var uint8Array = new Uint8Array(event.target.result);
             var pdata = framework._.sfCommon.getMetadataMgr().getPrivateData()
             var msg = { id: pdata.clientId, name: pdata.accountName, startTime: startTime, prepareTime: prepareTime, type: type, counter: counter, data: ab2str(uint8Array), averageTime: lastStats[type] }
             var kbit = Math.floor((uint8Array.length / 1024)*8*1000/duration);
             $("#cp-kbits-sending-" + type).text("" + kbit + "kbits/sec")
             if (msg.type=="video") {
                if (videoSendQueue.length>5) {
                    console.log("VIDEO QUEUE TOO FULL. DROPPING 5 Packets")
                    decreaseBitRate();
                    addSendingDropped(msg.type, videoSendQueue.length);
                    msg.dropped = videoSendQueue.length;
                    addSendingDropped(msg.type, audioSendQueue.length);
                    videoSendQueue = [];
                }
                videoSendQueue.push(msg);
                if (!status[type]) {
                  var pdata = framework._.sfCommon.getMetadataMgr().getPrivateData()
                  videoSendQueue.push({ id: pdata.clientId, name: pdata.accountName, startTime: 0, prepareTime: 0, type: "message", action : "stopvideo" });
                }
             }
             if (msg.type=="audio") {
                if (audioSendQueue.length>10) {
                    console.log("AUDIO QUEUE TOO FULL. DROPPING 10 Packets")
                    msg.dropped = audioSendQueue.length;
                    audioSendQueue = [];
                }
                audioSendQueue.push(msg);
             }
             emptyQueue();
             };
           fr.readAsArrayBuffer(recording[0]);
           if (status[type])
              sendStream(stream, type);
        })
    }

    function stopStream(type, screenSharing) {
      var stream1 = stream[type]
      console.log('Testing ' + stream1.screenSharing + "," + screenSharing)
      if (stream1 && stream1.screenSharing==screenSharing) {
        console.log("Stopping stream");
        stream1.getTracks().forEach(function(track) {
          track.stop();
        });
        status[type] = false;
      }
    }

    var status = { "video" : false, "audio" : false};

    function launchVideo(screenSharing) {
      
      var type = "video";
      var constraints = (screenSharing==true) ? screenSharingConstraints : videoConstraints
      stopStream(type, !screenSharing);
      if (screenSharing) {
          $("#cp-app-meet-camera").removeClass("cp-app-meet-camera-on")
          $("#cp-app-meet-camera").addClass("cp-app-meet-camera-off")
      } else {
          $("#cp-app-meet-screen").removeClass("cp-app-meet-screen-on")
          $("#cp-app-meet-screen").addClass("cp-app-meet-screen-off")        
      }

      if (status[type]==false) { 
            var media;
            try {
              media = navigator.mediaDevices.getUserMedia(constraints);
            } catch(e) {
              console.log(e);
            }
            media.then((stream1) => {
                stream1.screenSharing = screenSharing;
                if (screenSharing) {
                  $("#cp-app-meet-screen").removeClass("cp-app-meet-screen-off")
                  $("#cp-app-meet-screen").addClass("cp-app-meet-screen-on")
                } else {
                  $("#cp-app-meet-camera").removeClass("cp-app-meet-camera-off")
                  $("#cp-app-meet-camera").addClass("cp-app-meet-camera-on")
                }
                status[type] = true;
                video.srcObject = stream1;
                stream[type] = stream1;
                sendStream(stream1, type);
            });
       } else {
         stopStream(type, screenSharing);
         if (screenSharing) {
          $("#cp-app-meet-screen").removeClass("cp-app-meet-screen-on")
          $("#cp-app-meet-screen").addClass("cp-app-meet-screen-off")
         } else {
          $("#cp-app-meet-camera").removeClass("cp-app-meet-camera-on")
          $("#cp-app-meet-camera").addClass("cp-app-meet-camera-off")
        }
        status[type] = false;
       }
    } 

    /*
      Handling buttons
    */
    $("#cp-app-meet-camera").click(function() {
        launchVideo(false);
    });

    $("#cp-app-meet-screen").click(function() {
        launchVideo(true);
    });

    $("#cp-app-meet-microphone").click(function() {
       var type = "audio";
       if (status[type]==false) { 
           navigator.mediaDevices.getUserMedia(audioConstraints).
              then((stream1) => {
                $("#cp-app-meet-microphone").removeClass("cp-app-meet-microphone-off")
                $("#cp-app-meet-microphone").addClass("cp-app-meet-microphone-on")
                status[type] = true;
                stream[type] = stream1;
                sendStream(stream1, type);
            });
       } else {
          stopStream(type, false);
          $("#cp-app-meet-microphone").removeClass("cp-app-meet-microphone-on")
          $("#cp-app-meet-microphone").addClass("cp-app-meet-microphone-off")
          status[type] = false;
       }
    });

    /*
      Managing full screen video display
    */
    $("#remotevideo").click(function() {
          console.log("Remote video CLICK")
          if ($("#cp-app-meet-remote").hasClass("col-sm-12")) {
             $("#cp-app-meet-remote").removeClass("col-sm-12")
             $("#cp-app-meet-remote").addClass("col-sm-6")
             $("#cp-app-meet-own").show();
          } else {
             $("#cp-app-meet-remote").removeClass("col-sm-6")
             $("#cp-app-meet-remote").addClass("col-sm-12")
             $("#cp-app-meet-own").hide();
          }
        });

    $("#ownvideo").click(function() {
          console.log("Own video CLICK")
          if ($("#cp-app-meet-own").hasClass("col-sm-12")) {
             $("#cp-app-meet-own").removeClass("col-sm-12")
             $("#cp-app-meet-own").addClass("col-sm-6")
             $("#cp-app-meet-remote").show();
          } else {
             $("#cp-app-meet-own").removeClass("col-sm-6")
             $("#cp-app-meet-own").addClass("col-sm-12")
             $("#cp-app-meet-remote").hide()
          }
        });


    // Generic pad code

    // This is the main initialization loop
    var andThen2 = function (framework) {
        
        // Here you can load the objects or call the functions you have defined

        // This is the function from which you will receive updates from CryptPad
        // In this example we update the textarea with the data received
        framework.onContentUpdate(function (newContent) {
            console.log("Content should be updated to " + newContent);
            $("#cp-app-meet-content").val(newContent.content);
        });

        // This is the function called to get the current state of the data in your app
        // Here we read the data from the textarea and put it in a javascript object
        framework.setContentGetter(function () {
            var content = $("#cp-app-meet-content").val();
            console.log("Content current value is " + content);
            return {
                content: content
            };
        });

        // This is called when the system is ready to start editing
        // We focus the textarea
        framework.onReady(function (newPad) {
            $("#cp-app-meet-content").focus();
        });

        // We add some code to our application to be informed of changes from the textarea
        var oldVal = "";
        $("#cp-app-meet-content").on("change keyup paste", function () {
            var currentVal = $(this).val();
            if (currentVal === oldVal) {
                return; //check to prevent multiple simultaneous triggers
            }
            oldVal = currentVal;
            // action to be performed on textarea changed
            console.log("Content changed");
            // we call back the cryptpad framework to inform data has changes
            framework.localChange();
        });

        // starting the CryptPad framework
        window.framework = framework;
        framework.start();

        /*
          Manager connecting to Video WebSocket and receiving data
        */
        require([
            '/bower_components/netflux-websocket/netflux-client.js',
            '/common/outer/network-config.js'
        ], function (Netflux, NetConfig) {
          console.log("Connecting to video channel")
            var wsUrl = "ws://localhost:3000/cryptpad_websocket"; 
            // wsUrl = NetConfig.getWebsocketURL();
            // wsUrl = "wss://cryptpad.dubost.name/cryptpad_websocket";
            Netflux.connect(wsUrl).then(function (network) {
                var privateData = framework._.sfCommon.getMetadataMgr().getPrivateData();
                updateUserName(framework);
                network.join(privateData.channel + "01").then(function (wc) {
                    console.log("Connected to video channel")
                    videoWC = wc;
                   

                     wc.on('message', function (cryptMsg) {
                        console.log("Receiving encrypted data");
                        // console.log("Receiving encrypted data ", cryptMsg);
                        // var msg = videoEncryptor.decrypt(cryptMsg, null, true);
                        // console.log("Decrypting with key: " + secret.keys.cryptKey);
                        var msg = Crypto.decrypt(cryptMsg, secret.keys.cryptKey);
                        // console.log("Receiving message ", msg);
                        var parsed;
                        try {
                            parsed = JSON.parse(msg);
                            if (parsed) {
                                // console.log(parsed)
                                // checkRemoteUser(parsed.id);

                                if (parsed.type=="message") {
                                    if (parsed.action=="stopvideo") {
                                       remoteVideo.load();
                                    }
                                  // special message
                                } else {
                                 if (parsed.dropped) {
                                        addRemoteDropped(parsed.id, parsed.type, parsed.dropped);
                                  }

                                var uint8Array = str2ab(parsed.data);
                                // console.log(uint8Array);

                                if (parsed.type=="video") {
                                  if (!videoSourceBuffer.updating) { 
                                    console.log("Video SourceBuffer appending")
                                    videoSourceBuffer.appendBuffer(uint8Array);
                                    remoteVideo.play();
                                    var videoDisplayDoneTime = Date.now();
                                    var duration = videoDisplayDoneTime - parsed.startTime;
                                    addStats("remote", "video", duration);
                                    $("#cp-app-meet-remote-name").text(parsed.name);
                                    $("#cp-stats-remote-receive-video").text("" + parsed.averageTime+ "ms");
                                    var kbit = Math.floor((uint8Array.length / 1024)*1000*8/packetDuration);
                                    $("#cp-kbits-remote-video").text("" + kbit + "kbits/sec")
                                    console.log("Video SourceBuffer appending done: " + duration + "ms")
                                  } else {
                                    console.log("VIDEO SOURCE BUFFER IS BUSY")
                                    addRemoteDropped(parsed.id, parsed.type, 1);
                                  }
                                }

                                if (parsed.type=="audio") {
                                  if (!audioSourceBuffer.updating) { 
                                    console.log("Audio SourceBuffer appending")

                                    // audioCtx.decodeAudioData(audioData, function(buffer) {
                                    //  source.buffer = buffer
                                    //  source.connect(audioCtx.destination);
                                    //  source.start();

                                    audioSourceBuffer.appendBuffer(uint8Array);
                                    remoteAudio.play();
                                    var videoDisplayDoneTime = Date.now();
                                    var duration = videoDisplayDoneTime - parsed.startTime;
                                    addStats("remote", "audio", duration);
                                    $("#cp-app-meet-remote-name").text(parsed.name);
                                    $("#cp-stats-remote-receive-audio").text("" + parsed.averageTime+ "ms");
                                    var kbit = Math.floor((uint8Array.length / 1024)*1000/packetDuration);
                                    $("#cp-kbits-remote-audio").text("" + kbit + "kbits/sec")
                                    console.log("Audio SourceBuffer appending done: " + duration + "ms")
                                  } else {
                                    console.log("AUDIO SOURCE BUFFER IS BUSY")
                                    addRemoteDropped(parsed.id, parsed.type, 1);
                                  }
                                }

                                }
                            }
                            
                        } catch (e) { console.error(e); }
                        
                    });


                }, function (err) {
                  console.log("Failed opening video channel")
                });
            }, function (err) {
                console.log("Could not get network")
            });
        });
    };

    // This is the main starting loop
    var main = function () {
        var framework;

        nThen(function (waitFor) {

            // Framework initialization
            Framework.create({
                toolbarContainer: '#cme_toolbox',
                contentContainer: '#cp-app-meet-editor'
            }, waitFor(function (fw) {
                framework = fw;
                andThen2(framework);
            }));
        });
    };
    main();
});

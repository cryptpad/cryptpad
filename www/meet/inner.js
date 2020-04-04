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
    '/meet/resampler.js',
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
    var options = { "video" : { videoBitsPerSecond : 500000, mimeType : videoCodec }, "audio" : { audioBitsPerSecond : 16000, mimeType : audioCodec }}
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

    // audio capture objects
    var audioBufferSize = 16384;
    var audioInput;
    var audioGainNode;
    var audioRecorder;
    var audioContext;

    var users = {}
    var currentAudioChannels = 0;
    var status = { "video" : false, "audio" : false};
    
    var outputResampler;
    var inputResampler;
    // var audioSampler = new Resampler(44100, audioCodec.sampleRate, 1, audioCodec.bufferSize);
    // var audioEncoder = new OpusEncoder(audioCodec.sampleRate, audioCodec.channels, audioCodec.app, audioCodec.frameDuration);
    

    const videoConstraints = {video: { width: 1024, height: 576 } };
    const screenSharingConstraints = { video: { width: 1024, height: 576, mediaSource: 'screen'}};
    const audioConstraints = { audio: { sampleRate: 16000 } };
    const allConstraints = { audio: { sampleRate: 16000 }, video: { width: 1024, height: 576 } };
    var maxStatsSize = 10;
    var stats = {};
    const average = arr => arr.reduce((a,b) => a + b, 0) / arr.length
    var qualityValues = [50, 100, 250, 500, 1000, 5000, 10000, 25000, 50000];


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

    var lastSampleDate = Date.now();
    var lastAudioReceivedDate = Date.now();
    function launchAudio(framework) {
      silence = new Float32Array(audioBufferSize);
      audioPlayingQueue = {
            buffers: [new Float32Array(0), new Float32Array(0), new Float32Array(0),
                       new Float32Array(0), new Float32Array(0), new Float32Array(0)],

            write: function(newAudio, audioChannel) {
              var buffer = this.buffers[audioChannel];
              console.log("Adding new Audio in channel " + audioChannel + " " + newAudio.length)
              var currentQLength = buffer.length;
              var newBuffer = new Float32Array(currentQLength + newAudio.length);
              newBuffer.set(buffer, 0);
              newBuffer.set(newAudio, currentQLength);
              this.buffers[audioChannel] = buffer = newBuffer;
              console.log("New length " + buffer.length)
            },

            read: function(nSamples, audioChannel) {
              var buffer = this.buffers[audioChannel];
              var samplesToPlay = buffer.subarray(0, nSamples);
              this.buffers[audioChannel] = buffer = buffer.subarray(nSamples, buffer.length);
              return samplesToPlay;
            },

            length: function(audioChannel) {
              var buffer = this.buffers[audioChannel];
              return buffer.length;
            },

            reset: function(audioChannel) {
              var buffer = this.buffers[audioChannel];
              buffer = new Float32Array(0);
            }
        };
        // get Audio autorisation so that we can play sound
        // we activate the audio system
        audioContext = new window.AudioContext();
        navigator.mediaDevices.getUserMedia(allConstraints).then((stream1) => {
          var pdata = framework._.sfCommon.getMetadataMgr().getPrivateData()
          stream["audio"] = stream1;
          
          audioInput = audioContext.createMediaStreamSource(stream1);
          audioGainNode = audioContext.createGain();
          audioProcessor = audioContext.createScriptProcessor(audioBufferSize, 1, 6);
          console.log("Audio sample rate is " + audioContext.sampleRate);
          inputResampler = new Resampler(audioContext.sampleRate, 16000, 1, audioBufferSize);
          outputResampler = new Resampler(16000, audioContext.sampleRate, 1, audioBufferSize);

          // this is the audio playing and recording handling
          audioProcessor.onaudioprocess = function(e) {
              var startTime = lastAudioReceivedDate;
              lastAudioReceivedDate = Date.now();

            // console.log("In onaudioprocess");

            // This part plays audio that is being received
            // If we are too much behind we drop packats to catch up
            for (var audioChannel=0;audioChannel<currentAudioChannels;audioChannel++) {
                if (audioPlayingQueue.length(audioChannel)==0) {
                  console.log("Nothing to play for channel " + audioChannel)
                  // console.log("Playing silence");
                  // e.outputBuffer.getChannelData(audioChannel).set(silence);
                } else if (audioPlayingQueue.length(audioChannel)>16384*10) {
                  console.log("Sample in buffer too long. Dropping");
                  audioPlayingQueue.reset(audioChannel);
                  var nb = audioPlayingQueue.length(audioChannel)/16384;
                  addRemoteDropped(type, nb);
                } else {
                  console.log("Playing a sample");
                  var sourceData = audioPlayingQueue.read(audioBufferSize, audioChannel);
                  var newQueueLength = audioPlayingQueue.length(audioChannel);
                  e.outputBuffer.getChannelData(audioChannel).set(sourceData);
                  var sampleDuration = e.outputBuffer.duration;
                  var sampleDate = Date.now();
                  var sampleDelay = sampleDate - lastSampleDate;
                  lastSampleDate = sampleDate;
                  console.log("Channel " + audioChannel + " Sample size: " + sourceData.length + " duration: " + sampleDuration 
                            + " delay since previous sample: " + sampleDelay + " queue left: " + newQueueLength);
                } 
            }
          
            var type = "audio";
            // If the audio streaming is active we should send data
            if (status[type]) {
              
              // resampling the audio data to 16000
              var sourceData = e.inputBuffer.getChannelData(0);
              var data = inputResampler.resampler(sourceData);
              console.log("Capturing source data duration " + e.inputBuffer.duration + "s (" + sourceData.length + ") resampled to " + data.length)
              // console.log(sourceData);
              // console.log(data);
              // console.log(data)
              var uint8array = new Uint8Array(data.buffer)
              // console.log(uint8array)
              var prepareTime = Date.now();
              var msg = { id: pdata.clientId, name: pdata.accountName, startTime: startTime, prepareTime: prepareTime, type: type, counter: counter++, data: ab2str(uint8array), averageTime: lastStats[type] }
              if (audioSendQueue.length>5) {
                console.log("AUDIO QUEUE TOO FULL. DROPPING 10 Packets")
                msg.dropped = audioSendQueue.length;
                addSendingDropped(msg.type, audioSendQueue.length);
                audioSendQueue = [];
              }
             audioSendQueue.push(msg);
             emptyQueue();
            }
          };
          audioInput.connect(audioGainNode);
          audioGainNode.connect(audioProcessor);
          audioProcessor.connect(audioContext.destination);
        });  
      }
    
    
    
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
    function checkRemoteUser(clientId, cb) {
      var user = users[clientId];
      if (user) {
        console.log("Found user " + user);
        user.lastSeen = Date.now();
        cb(user);
        return;
      }

      console.log("Creating user " + clientId);
      user = {}
      user.audioChannel = currentAudioChannels;
      currentAudioChannels++;
      user.init = true;
      users[clientId] = user;
      user.lastSeen = Date.now();
      var html = "<div id='cp-app-meet-REMOTEUSER' class='cp-app-meet-video col-sm-6'> \
                            <div id='cp-app-meet-video-REMOTEUSER' class='cp-app-meet-video-element'> \
                                <div class='cp-app-remote-stats'> \
                                    <span id='cp-app-meet-REMOTEUSER-name' class='cp-app-meet-remote-name'></span> \
                                    <span id='cp-stats-REMOTEUSER-video' class='cp-app-stats-item'></span> \
                                    <span id='cp-stats-REMOTEUSER-audio' class='cp-app-stats-item'></span> \
                                    <span id='cp-stats-REMOTEUSER-receive-video' class='cp-app-stats-item'></span> \
                                    <span id='cp-stats-REMOTEUSER-receive-audio' class='cp-app-stats-item'></span> \
                                    <span id='cp-kbits-REMOTEUSER-video' class='cp-app-stats-item'></span> \
                                    <span id='cp-kbits-REMOTEUSER-audio' class='cp-app-stats-item'></span> \
                                    <span id='cp-dropped-REMOTEUSER-video' class='cp-app-stats-item'></span> \
                                    <span id='cp-dropped-REMOTEUSER-audio' class='cp-app-stats-item'></span> \
                                </div> \
                                <video id='REMOTEUSERvideo' width='1024' height='576' autoplay></video> \
                            </div> \
                </div>";
      var remoteUserHTML = html.replace(/REMOTEUSER/g, "remote" + clientId);
      console.log("Inserting HTML")
      $(remoteUserHTML).insertAfter($("#cp-app-meet-own"));
      user.remoteUserDoc = $("#cp-app-meet-remote" + clientId);
      user.remoteVideo = document.querySelector('#remote' + clientId + 'video');
      
      var mediaSource = new MediaSource();
      mediaSource.addEventListener('error', function (e) {
        console.log("MEDIASOURCE ERROR", e)
      }, false);
      mediaSource.addEventListener('sourceopen', function() { 
        console.log("Remote video source open for user " + clientId)
        
        user.videoSourceBuffer = mediaSource.addSourceBuffer(videoCodec);
        user.videoSourceBuffer.mode = "sequence";
        user.init = false;
        cb(user);
      }, false);
      user.remoteVideo.src = window.URL.createObjectURL(mediaSource);
      console.log(user);
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
                    // onsole.log(msg)
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
          console.log("Sending channel not ready. Waiting");
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
                    addSendingDropped(msg.type, audioSendQueue.length);
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

    function initButtons() {

      /*
        Managing Video Quality Bitrate
      */
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
                  // connect the receiver part
                  // var audioGainPlayingNode = audioContext.createGain();
                  // audioSourceBuffer.connect(scriptPlayingNode);
                  // scriptPlayingNode.connect(audioContext.destination);
                  // audioGainPlayingNode.connect(audioContext.destination);
                  //try { audioSourceBuffer.start(); } catch (e) {}
                  // audioContext = new window.AudioContext()


                  $("#cp-app-meet-microphone").removeClass("cp-app-meet-microphone-off")
                  $("#cp-app-meet-microphone").addClass("cp-app-meet-microphone-on")
                  status[type] = true;
              });
         } else {
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
    }


    // Prepare buttons
    initButtons();

    

    // This is the main initialization loop
    var andThen2 = function (framework) {
        

        // launch audio sub-system
        launchAudio(framework); 

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
                                checkRemoteUser(parsed.id, function(user) {

                                  // we cannot handle frames until the mediastream is initialiazed.
                                  if (user.init)
                                    return;

                                  try {
                                    if (parsed.type=="message") {
                                        if (parsed.action=="stopvideo") {
                                           user.remoteVideo.load();
                                        }
                                      // special message
                                    } else {
                                      if (parsed.dropped) {
                                            addRemoteDropped(parsed.id, parsed.type, parsed.dropped);
                                      }

                                      var uint8Array = str2ab(parsed.data);
                                      
                                      if (parsed.type=="video") {
                                        var doneTime = Date.now();
                                        var doneDuration = doneTime - parsed.startTime;
                                        var delay = (doneDuration>1000) ? 0 : 700;
                                        console.log("Delaying video by " + delay + "ms")
                                        window.setTimeout(function() {
                                          if (!user.videoSourceBuffer.updating) { 
                                            console.log("Video sourcebuffer appending for user " + parsed.id)
                                            user.videoSourceBuffer.appendBuffer(uint8Array);
                                            user.remoteVideo.play();
                                            var videoDisplayDoneTime = Date.now();
                                            var duration = videoDisplayDoneTime - parsed.startTime;
                                            addStats("remote" + parsed.id, "video", duration);
                                            $("#cp-app-meet-remote" + parsed.id + "-name").text(parsed.name);
                                            $("#cp-stats-remote" + parsed.id + "-receive-video").text("" + parsed.averageTime+ "ms");
                                            var kbit = Math.floor((uint8Array.length / 1024)*1000*8/packetDuration);
                                            $("#cp-kbits-remote" + parsed.id + "-video").text("" + kbit + "kbits/sec")
                                            console.log("Video sourcebuffer for user " + parsed.id + " appending done: " + duration + "ms")
                                          } else {
                                           console.log("VIDEO SOURCE BUFFER IS BUSY FOR USER " + parsed.id)
                                           addRemoteDropped(parsed.id, parsed.type, 1);
                                          }
                                        }, delay);
                                      }

                                      if (parsed.type=="audio") {
                                          console.log("Audio SourceBuffer appending")

                                          console.log(parsed.counter);
                                          var dView1 = new DataView(uint8Array.buffer)
                                          var audioData  = new Float32Array(uint8Array.length / 4);
                                          var p = 0;
                                          for(var j=0; j < audioData.length; j++){
                                              p = j * 4;
                                              audioData[j] = dView1.getFloat32(p,true);
                                          }
                                          
                                          // console.log(audioData);
                                          // we need to resampler before adding to the playing queue
                                          if (!outputResampler) {
                                              console.log("Audio context is not yet ready")
                                          } else {
                                              var data = outputResampler.resampler(audioData);
                                              audioPlayingQueue.write(data, user.audioChannel)
                                              var audioDoneTime = Date.now();
                                              var duration = audioDoneTime - parsed.startTime;
                                              addStats("remote", "audio", duration);
                                              $("#cp-app-meet-remote-name").text(parsed.name);
                                              $("#cp-stats-remote-receive-audio").text("" + parsed.averageTime+ "ms");
                                              var kbit = Math.floor((uint8Array.length / 1024)*1000/packetDuration);
                                              $("#cp-kbits-remote-audio").text("" + kbit + "kbits/sec")
                                              console.log("Audio SourceBuffer appending done: " + duration + "ms")
                                          }
                                        }
                                      }
                                  } catch (e) { console.error(e); }
                                });
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

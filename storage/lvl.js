var level=require("level");

module.exports.create = function(conf,cb){
    console.log("Loading leveldb");

    var db=level(conf.levelPath||'./test.level.db'),
        indices={},
        Channel={};

    var makeChannel=function(cName){
        Channel[cName]={
            lastModified:0,
            messages:[],
        };
    },
    makeIndex=function(cName){
        // initializing to negative one means we can increment on inserts
        // so we always start from zero.
        indices[cName]=-1;
    },
    loadIndex=function(cName, out){
        indices[cName]=parseInt(out);
        typeof indices[cName] !== 'number' && 
            console.error("FOUND A NON-NUMERIC INDEX for channel: %s", cName);
    },
    getIndex=function(cName,f){
        if(typeof indices[cName] !== 'undefined'){
            f(indices[cName]);
        }else{
            // get and increment the channelIndex
            db.get(cName+'=>index',function(e,out){
                if(e){
                    // it doesn't exist, so initialize it
                    makeIndex(cName);
                }else{
                    // it exists. parse it
                    loadIndex(cName,out);
                }
                f(indices[cName]);
            });
        }
    };

    cb({
        message: function(cName,content,cb){
            getIndex(cName,function(index){
                var index = ++indices[cName];
                db.put(cName+'=>index', ''+index,function(e){
                    if(e) console.error(e);
                });
                db.put(cName+'=>'+index, content, function(err){
                    if(err){
                        console.log(err);
                    }
                    cb();
                });
            });
        },
        getMessages: function(cName, cb){
            /* get all messages relating to a channel */
            getIndex(cName, function(index){
                var last = index,
                    i = 0,
                    next = function () {
                        db.get(cName+'=>'+i, function (e,out) {
                            if(e) return console.error(e);
                            cb(out);
                            if (++i <= last) {
                                next();
                            }
                        });
                    };
                next();
            });
        },
    });
};

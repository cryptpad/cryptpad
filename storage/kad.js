var kad=require("kad");
var levelup=require("levelup");

module.exports.create=function(conf,cb){
    var dht= kad({
        address:conf.kadAddress,
        port:conf.kadPort,
        storage:levelup(conf.kadStore),
        seeds:conf.kadSeeds,
        transport: kad.transports.UDP,
    });

    var dht2=kad({
        address: conf.kadAddress,
        port:conf.kadPort+1,
        storage:levelup('./kadstore2.db'),
        seeds:[],
        transport: kad.transports.UDP,
    });

    var indices={},
        Channel={};

    var makeChannel=function(cName){
        Channel[cName]={
            lastModified:0,
            messages:[],
        };
    },
    makeIndex=function(cName){
        indices[cName]=-1;
    },
    loadIndex=function(cName,out){
        indices[cName]=parseInt(out);
        typeof indices[cName] !== 'number' &&
            console.error('FOUND A NON-NUMERIC INDEX for channel: %s',cName);
    },
    getIndex=function(cName,f){
        if(typeof indices[cName] !== 'undefined'){
            f(indices[cName]);
        }else{
            dht.get(cName+'=>index',function(e,out){
                e?  makeIndex(cName): loadIndex(cName,out);
                f(indices[cName]);
            });
        }
    };

    cb({
        message:function(cName, content, cb){
            getIndex(cName, function(index){
                var index = ++indices[cName];
                dht.put(cName+'=>index', ''+index,function(e){
                    e && console.error(e);
                });
                dht.put(cName+'=>'+index, content, function(e){
                    e && console.error(e);
                    cb();
                });
            });
        },
        getMessages: function(cName, cb){
            getIndex(cName, function(index){
                for(var i=index;i>=0;i--){
                    dht.get(cName+'=>'+i,function(e,out){
                        if(e) return console.error(e);
                        cb(out);
                    });
                }
            });
        },
    });
};

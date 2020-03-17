/* jshint esversion: 6 */
/* global Buffer */

const ToPull = require('stream-to-pull-stream');
const Pull = require('pull-stream');

const Stream = module.exports;

// transform a stream of arbitrarily divided data
// into a stream of buffers divided by newlines in the source stream
// TODO see if we could improve performance by using libnewline
const NEWLINE_CHR = ('\n').charCodeAt(0);
const mkBufferSplit = () => {
    let remainder = null;
    return Pull((read) => {
        return (abort, cb) => {
            read(abort, function (end, data) {
                if (end) {
                    if (data) { console.log("mkBufferSplit() Data at the end"); }
                    cb(end, remainder ? [remainder, data] : [data]);
                    remainder = null;
                    return;
                }
                const queue = [];
                for (;;) {
                    const offset = data.indexOf(NEWLINE_CHR);
                    if (offset < 0) {
                        remainder = remainder ? Buffer.concat([remainder, data]) : data;
                        break;
                    }
                    let subArray = data.slice(0, offset);
                    if (remainder) {
                        subArray = Buffer.concat([remainder, subArray]);
                        remainder = null;
                    }
                    queue.push(subArray);
                    data = data.slice(offset + 1);
                }
                cb(end, queue);
            });
        };
    }, Pull.flatten());
};

// return a streaming function which transforms buffers into objects
// containing the buffer and the offset from the start of the stream
const mkOffsetCounter = () => {
    let offset = 0;
    return Pull.map((buff) => {
        const out = { offset: offset, buff: buff };
        // +1 for the eaten newline
        offset += buff.length + 1;
        return out;
    });
};

// readMessagesBin asynchronously iterates over the messages in a channel log
// the handler for each message must call back to read more, which should mean
// that this function has a lower memory profile than our classic method
// of reading logs line by line.
// it also allows the handler to abort reading at any time
Stream.readFileBin = (stream, msgHandler, cb) => {
    //const stream = Fs.createReadStream(path, { start: start });
    let keepReading = true;
    Pull(
        ToPull.read(stream),
        mkBufferSplit(),
        mkOffsetCounter(),
        Pull.asyncMap((data, moreCb) => {
            msgHandler(data, moreCb, () => {
                try {
                    stream.close();
                } catch (err) {
                    console.error("READ_FILE_BIN_ERR", err);
                }
                keepReading = false;
                moreCb();
            });
        }),
        Pull.drain(() => (keepReading), (err) => {
            cb((keepReading) ? err : undefined);
        })
    );
};

[![Build Status][ci-img]][ci-url]
[![Coverage Status][cov-img]][cov-url]
[![Code Climate][clim-img]][clim-url]

# Safe Log Reader

Read plain or compressed log files from disk, deliver as [batches of] lines to a log consumer. Wait for the log consumer to report success. Repeat ad infinitum.

# Install

    npm i safe-log-reader

# Usage

````js
var read = require('safe-line-reader');
read.createReader(filePath, {
    batchLimit: 1024,
    bookmark: {
        dir: path.resolve('someDir', '.bookmark'),
    }
})
.on('readable', function () { this.readLine(); })
.on('read', function (line, count) {
    // do something with this line of text
})
.on('end', function (done) {
    // close up shop and go home
});
````

## Features

- [x] Read plain text files
- [x] Handles common log file events
    - [x] reads growing files (aka: tail -F)
    - [x] reads rotated logs
        - [x] reads the new file when it appears
            - [x] fs.watch tested on:
                - [x] Mac OS X
                - [x] Linux
                - [x] FreeBSD
        - [ ] continues reading old log file until quiet (necessary?)
    - [ ] file truncation (echo '' > foo.log)
    - [x] watches for non-existent log to appear
- [x] Read compressed log files
    - [x] gzip (zlib)
    - [ ] bzip2
- [x] Emits data as lines, upon request (paused mode streaming)
    - [x] Uses a [Transform Stream](https://nodejs.org/api/stream.html#stream_class_stream_transform_1) to efficiently convert buffer streams to lines
    - [x] waits for confirmation, then advances bookmarks
- [x] handles utf-8 multibyte characters properly
- [x] Remembers previously read files (bookmarks)
    - [x] Perists across program restarts
        - [x] identifies files by inode
        - [x] saves file data: name, size, line count, inode
    - [x] When safe, uses byte position to efficiently resume reading
- [ ] cronolog naming syntax (/var/log/http/YYYY/MM/DD/access.log)
    - [ ] watches existing directory ancestor
- [ ] winston naming syntax (app.log1, app.log2, etc.)
- [x] zero dependencies

# Shippers

- [x] [log-ship-elastic-postfix](https://github.com/DoubleCheck/log-ship-elastic-postfix)
    - reads batches of log entries
    - parses with [postfix-parser](https://github.com/DoubleCheck/postfix-parser)
    - fetches matching docs from ES
    - updates/creates normalized postfix docs
    - saves docs to elasticsearch
- [ ] log-ship-elastic-qpsmtpd
    - receives JSON parsed log lines
    - saves to elasticsearch
- [ ] log-ship-elastic-lighttpd
    - receives JSON parsed log lines
    - saves to elasticsearch

# Similar Projects

* [tail-stream](https://github.com/Juul/tail-stream) has good options for
  reading a file and handling rotation, truncation, and resuming. It had no
  tests so I wrote them and most have been merged. Bugs remain
  (demonstrated with Travis-CI test integration) unresolved. The author
  offered me a license in exchange for the tests I wrote but I don't want my
  library infected by the GPL.
* [tail-forever](https://github.com/mingqi/tail-forever) has character
  encoding detection and very basic file watching.
* [always-tail](https://github.com/jandre/always-tail)

The key "missing" feature of the node "tail" libraries is the ability to
resume correctly after the app has stopped reading (think: kill -9)
in the middle of a file. Because files are read as bytes, and log
entries are processed as lines, resuming at the last byte position is likely
to be in the middle of a line, or even splitting a multi-byte character.
There's no way to correlate a line with its byte position. Further, the
extra buffered bytes not yet emitted as lines are lost, unless at restart,
one rewinds and replays the last full $bufferSize.

The key to resuming reading a log file "safely" is to track line numbers.
Rather than reading in chunks of bytes, safe-log-reader uses a Transform
Stream to convert the byte stream into lines. It also makes it dead simple
to read compressed files by adding a `.pipe(ungzip())` into the stream.

When watching growing log files, S-L-R also uses byte positions. Having read
to the end of a file, we can know *that* byte position does coincide with
the end of a log line.



[ci-img]: https://travis-ci.org/DoubleCheck/safe-log-reader.svg
[ci-url]: https://travis-ci.org/DoubleCheck/safe-log-reader
[cov-img]: https://coveralls.io/repos/DoubleCheck/safe-log-reader/badge.svg
[cov-url]: https://coveralls.io/github/DoubleCheck/safe-log-reader
[clim-img]: https://codeclimate.com/github/DoubleCheck/safe-log-reader/badges/gpa.svg
[clim-url]: https://codeclimate.com/github/DoubleCheck/safe-log-reader

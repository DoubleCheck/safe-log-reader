'use strict';

if (process.env.COVERAGE) require('blanket');

var fs      = require('fs');
var path    = require('path');

var logger    = require('./logger');

function Bookmark (dir, options) {
	// logger.info(arguments);
	if (!dir) dir = './.bookmark';

	this.dirPath = path.resolve(dir);

	// if the directory doesn't exist, try to make it
    this.createDir();

	logger.debug(this);
}

Bookmark.prototype.createDir = function(done) {
    var bm = this;

    fs.stat(bm.dirPath, function (err, stat) {
        if (done) return done();
        if (!err) return;        // already exists

        if (err.code !== 'ENOENT') {
            if (done) return done(err);
            logger.error(err);  // unexpected error
            return;
        }

        // try creating it
        fs.mkdir(bm.dirPath, function (err) {
            if (done) return done(err);
            if (err) return logger.error(err);
            logger.info('created bookmark dir: ' + bm.dirPath);
            if (done) done(null, 'created ' + bm.dirPath);
        });
    });
};

Bookmark.prototype.save = function(logFilePath, lines, done) {
	var bm = this;
    fs.stat(logFilePath, function (err, stat) {
        if (err) return done(err);

        var contents = JSON.stringify({
            file: logFilePath,
            size: stat.size,
            lines: lines,
            inode: stat.ino,
        });

		var bmPath = path.resolve(bm.dirPath, stat.ino.toString());
        fs.writeFile(bmPath, contents, function (err) {
            if (err) return done(err);
            logger.info('bookmark.save: line: ' + lines);
            done();
        });
    });
};

Bookmark.prototype.read = function(logFilePath, done) {
	var bm = this;

    fs.stat(logFilePath, function (err, stat) {
        if (err) return done(err);

        var bmPath = path.resolve(bm.dirPath, stat.ino.toString());
        fs.readFile(bmPath, function (err, data) {
			if (err) return done(err);
			if (!data) return done('empty bookmark file!');
            var mark = JSON.parse(data);
            logger.info('bookmark.read: line ' + mark.lines);
			return done(err, mark);
        });
    });
};

module.exports = function (options) {
    return new Bookmark(options);
};
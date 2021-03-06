var jsdiff = require("diff");

module.exports = {
  diff: function(lhs, rhs) {
    var result = []

    var getString = function(str) {
      return (str == null || str == undefined) ? "" : str;
    }
    var addDelta = function(delta) {
      delete delta["count"];
      result.push(delta);
    }

    var lhs_ = getString(lhs);
    var rhs_ = getString(rhs);
    var lineDiff = jsdiff.diffLines(lhs_, rhs_);
    var index = 0;
    while (index < lineDiff.length) {
      var delta1 = lineDiff[index];
      if (index < lineDiff.length - 1) {
        var delta2 = lineDiff[index + 1];

        if (delta1.removed && delta2.added) {
          var useLineDiffFlag = false;

          // Decide whether word diff is used
          if (delta1.count == delta2.count) {
            var wordDiff = jsdiff.diffWords(delta1.value, delta2.value, {
              ignoreWhitespace: false
            });

            // Might use word diff when number of lines of original and revised texts are same.
            for (delta of wordDiff) {
              if ((delta.added || delta.removed) && ~delta.value.indexOf('\n')) {
                useLineDiffFlag = true;
                break;
              }
            }
            if (!useLineDiffFlag) {
              // Use word diff
              for (var i = 0; i < wordDiff.length; i++) {
                addDelta(wordDiff[i]);
              }
            }
          } else {
            var lines1 = delta1.value.split("\n");
            var lines2 = delta2.value.split("\n");

            var maxLineNum = Math.max(lines1.length - 1, lines2.length - 1);
            var diffMap = [];

            var added = true;
            var removed = true;

            for (var i = 0; i < maxLineNum; i++) {
              if (i < lines1.length - 1) {
                var line1 = lines1[i];
                if (i < lines2.length - 1) {
                  var line2 = lines2[i];
                  var wordDiff = jsdiff.diffWords(line1, line2)
                  wordDiff.push({value: "\n"})
                  diffMap.push(wordDiff);

                  for (delta of wordDiff) {
                    if (delta.added) removed = false;
                    if (delta.removed) added = false;
                  }
                } else {
                  diffMap.push([{
                    added: undefined,
                    removed: true,
                    value: line1 + "\n"
                  }])

                  added = false
                }
              } else {
                var line2 = lines2[i];
                diffMap.push([{
                  added: true,
                  removed: undefined,
                  value: line2 + "\n"
                }])

                removed = false
              }

              if (!added && !removed) break;
            }
            if (added || removed) {
              for (diff of diffMap) {
                for (delta of diff) {
                  addDelta(delta)
                }
              }
            } else {
              useLineDiffFlag = true;
            }
          }

          if (useLineDiffFlag) {
            // Use line diff
            addDelta(delta1);
            addDelta(delta2);
          }

          index += 2;
        } else {
          addDelta(delta1);

          index += 1;
        }
      } else {
        addDelta(delta1);

        index += 1;
      }
    }

    return result;
  },
  addLineNumbers: function(diff_) {
    // Convert diff data structure to display
    var diff = [];
    var lineNumberOfLhs = 0;
    var lineNumberOfRhs = 0;
    var isInLhs = false;
    var isInRhs = false;
    var delta = null;

    var i = 0;
    while (i < diff_.length) {
      if (
        (i != diff_.length - 1) &&
        diff_[i].removed && diff_[i + 1].added &&
        diff_[i].value.endsWith("\n") && diff_[i + 1].value.endsWith("\n")
      ) {
        // Replace lines
        var removedDelta = diff_[i];
        var addedDelta = diff_[i + 1];

        // Add removedDelta to diff
        var rlines = removedDelta.value.split("\n");
        for (var j = 0; j < rlines.length - 1; j++) {
          var line = rlines[j];
          diff.push({
            lineNumberOfLhs: lineNumberOfLhs,
            values: [{
              removed: true,
              value: line
            }]
          });
          lineNumberOfLhs += 1;
        }
        // Add addedDelta to diff
        var alines = addedDelta.value.split("\n");
        for (var j = 0; j < alines.length - 1; j++) {
          var line = alines[j];
          diff.push({
            lineNumberOfRhs: lineNumberOfRhs,
            values: [{
              added: true,
              value: line
            }]
          });
          lineNumberOfRhs += 1;
        }

        i += 2;
      } else {
        var delta_ = diff_[i];
        var lines = delta_.value.split('\n');

        var length = delta_.value.endsWith("\n") ? lines.length - 1 : lines.length

        for (var j = 0; j < length; j++) {
          delta = delta || {};
          delta.values = delta.values || [];

          var line = lines[j];

          if (!delta_.removed) {
            // delta.value is in the rhs
            isInRhs = true;
          }
          if (!delta_.added) {
            // delta.value is in the lhs
            isInLhs = true;
          }

          if (line.length != 0) {
            if (delta_.removed) {
              delta.values.push({
                removed: true,
                value: line
              });
            } else if (delta_.added){
              delta.values.push({
                added: true,
                value: line
              });
            } else {
              delta.values.push({
                value: line
              })
            }
          }

          if (j != lines.length - 1 || delta_.value.endsWith("\n")) {
            // End a line
            if (isInRhs) {
              // delta.value is in the rhs
              delta.lineNumberOfRhs = lineNumberOfRhs;
              lineNumberOfRhs += 1;
            }
            if (isInLhs) {
              // delta.value is in the lhs
              delta.lineNumberOfLhs = lineNumberOfLhs;
              lineNumberOfLhs += 1;
            }
            if (delta.values.length == 0) {
              if (isInRhs && isInLhs) {
                delta.values.push({value: ""});
              } else if (isInRhs) {
                delta.values.push({
                  added: true,
                  value: ""
                });
              } else if (isInLhs) {
                delta.values.push({
                  removed: true,
                  value: ""
                });
              }
            }
            diff.push(delta);

            // Initialize the local variables
            isInRhs = false;
            isInLhs = false;
            delta = null;
          }
        }
        i += 1;
      }
    }

    if (delta != null) {
      // Deal with a corner case (when last character of text is not \n)
      if (isInRhs) {
        // delta.value is in the rhs
        delta.lineNumberOfRhs = lineNumberOfRhs;
        lineNumberOfRhs += 1;
      }
      if (isInLhs) {
        // delta.value is in the lhs
        delta.lineNumberOfLhs = lineNumberOfLhs;
        lineNumberOfLhs += 1;
      }

      if (delta.values.length == 0) {
        if (isInRhs && isInLhs) {
          delta.values.push({value: ""});
        } else if (isInRhs) {
          delta.values.push({
            added: true,
            value: ""
          });
        } else if (isInLhs) {
          delta.values.push({
            removed: true,
            value: ""
          });
        }
      }

      diff.push(delta);
    }

    return diff;
  },

  extractDiff: (diffWithLineNumbers, line) => {
    if (line < 0) return [diffWithLineNumbers];

    var result = [];
    var group = [];
    var lastIndex = null;
    for (var i = 0; i < diffWithLineNumbers.length; i++) {
      var lineDelta = diffWithLineNumbers[i];

      var isChanged = lineDelta.values.some((elem, index, arr) => {
        return elem.added || elem.removed;
      })

      if (isChanged) {
        // Add deltas near this delta
        if (lastIndex != null && lastIndex < i - line - 1) {
          // Divide a group
          result.push(group);
          group = [];
          lastIndex = null;
        }

        // Add lines
        lastIndex = (lastIndex == null) ? i - line - 1 : lastIndex;
        for (var j = lastIndex + 1; j <= i + line; j++) {
          if (j >= 0 && j < diffWithLineNumbers.length) {
            group.push(diffWithLineNumbers[j]);
          }
        }

        // Update lastIndex
        lastIndex = i + line;
      }
    }
    if (group.length != 0) {
      result.push(group);
    }

    return result;
  }
}

var diff = require("diff");

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

    var lineDiff = diff.diffLines(lhs_, rhs_);
    var index = 0;
    while (index < lineDiff.length) {
      var delta1 = lineDiff[index];
      if (index < lineDiff.length - 1) {
        var delta2 = lineDiff[index + 1];

        if (delta1.removed && delta2.added) {
          if (delta1.count == delta2.count) {
            // Might use word diff when number of lines of original and revised texts are same.
            var wordDiff = diff.diffWords(delta1.value, delta2.value);

            var useLineDiffFlag = false;

            for (var i = 0; i < wordDiff.length; i++) {
              var delta = wordDiff[i];
              if ((delta.added || delta.removed) && ~delta.value.indexOf('\n')) {
                useLineDiffFlag = true;
                break;
              }
            }

            if (useLineDiffFlag) {
              // Use line diff
              addDelta(delta1);
              addDelta(delta2);
            } else {
              // Use word diff
              for (var i = 0; i < wordDiff.length; i++) {
                addDelta(wordDiff[i]);
              }
            }

            index += 2;
          } else {
            addDelta(delta1);
            addDelta(delta2);
            index += 2;
          }
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
    for (delta_ of diff_) {
      var lines = delta_.value.split('\n');
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i]

        delta = delta || {};
        delta.values = delta.values || [];


        if (!delta_.removed) {
          // delta.value is in the rhs
          isInRhs = true;
        }
        if (!delta_.added) {
          // delta.value is in the lhs
          isInLhs = true;
        }

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
        if ((i != lines.length - 1) || delta_.value[delta_.value.length - 1] == '\n') {
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
          diff.push(delta);

          // Initialize the local variables
          isInRhs = false;
          isInLhs = false;
          delta = null;
        }
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
      diff.push(delta);
    }

    return diff;
  }
}

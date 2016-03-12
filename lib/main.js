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
  }
}

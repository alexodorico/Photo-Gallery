import JSZip from "jszip";
import "file-saver";
import JSZipUtils from "jszip-utils";
import utils from "./utils";

let total, count, failed;
let zip = new JSZip();

function createZip(urls, zipName) {
  (count = 0), (failed = 0);
  total = urls.length;
  for (var i in urls) addFile(urls[i], zipName);
}

function addFile(path, zipName) {
  let parts = getFileParts(path);

  JSZipUtils.getBinaryContent(path, function(err, data) {
    if (err) {
      console.log(err);
      failed++;
    } else {
      zip.file(parts[0] + "." + parts[1], data, { binary: true });
      checkComplete(zipName);
    }
  });
}

function checkComplete(zipName) {
  count++;

  if (count + failed == total) {
    zip.generateAsync({ type: "blob" }).then(function(content) {
      saveAs(content, zipName + ".zip");

      // Notify user of errors
      if (failed !== 0) {
        utils.showMessage(
          "Whoops! Looks like we couldn't get your selected photos.",
          "alert-warning"
        );
      }

      utils.showMessage("Your download is complete!", "alert-success");
    });

    // Reset for next download
    (count = 0), (failed = 0);
    zip = new JSZip();
  }
}

function getFileParts(path) {
  var b = path.lastIndexOf("/") + 1;
  var e = path.indexOf("?");
  if (e < 0) e = path.length;
  var filename = path.substr(b, e - b);

  var d = filename.indexOf(".");
  var fn = filename.substr(0, d);
  var ext = filename.substr(d + 1, filename.length - d);

  return [fn, ext];
}

export default createZip;

// Home — animated gradient ribbon
(function () {
  var ribbon = document.getElementById("ribbon");
  if (!ribbon) return;
  var stops = [
    "#ff5d3b", "#ff9a3b", "#ffd23b", "#9be53b", "#3bd16a",
    "#3bd9c0", "#3b9dff", "#7a6cff", "#b13bff", "#ff3ba7"
  ];
  ribbon.innerHTML = stops
    .map(function (c) { return '<span style="background:' + c + '"></span>'; })
    .join("");
})();

//document.addEventListener('DOMContentLoaded', function() {
//    var elems = document.querySelectorAll('.sidenav');
//    var instances = M.Sidenav.init(elems, {edge:'left'});
//});

document.addEventListener("DOMContentLoaded", function () {
  var elems = document.querySelectorAll(".nav-wrapper");
  var instances = M.Sidenav.init(elems, { edge: "left" });

  var elems = document.querySelectorAll(".tooltipped");
  var instances = M.Tooltip.init(elems, "{position:'bottom'}");
});

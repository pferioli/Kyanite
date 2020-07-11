//---------------------------------------------------------------------------//
// Floating Action Buttons Handlers
//---------------------------------------------------------------------------//

document.addEventListener("DOMContentLoaded", function () {
  var elems = document.querySelectorAll(".fixed-action-btn");
  var instances = M.FloatingActionButton.init(elems, {
    direction: "top",
    toolbarEnabled: false,
  });
});

const btn_new_text_card = document.getElementById("btn_new_text_card");
const btn_new_multiple_card = document.getElementById("btn_new_multiple_card");
const btn_new_single_card = document.getElementById("btn_new_single_card");
const btn_save_survey = document.getElementById("btn_save_survey");
const btn_get_link = document.getElementById("btn_get_link");
const btn_publish_survey = document.getElementById("btn_publish_survey");

btn_new_text_card.addEventListener("click", function (e) {});

btn_new_multiple_card.addEventListener("click", function (e) {});

btn_new_single_card.addEventListener("click", function (e) {});

btn_save_survey.addEventListener("click", function (e) {});

btn_get_link.addEventListener("click", function (e) {});

btn_publish_survey.addEventListener("click", function (e) {});

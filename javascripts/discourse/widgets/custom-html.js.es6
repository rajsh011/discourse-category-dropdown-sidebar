import { scheduleOnce } from "@ember/runloop";
import { createWidget } from 'discourse/widgets/widget';

let layoutsError;
let layouts;

let cats_data = null;
let cat_item_html = [];
document.addEventListener("DOMContentLoaded", function () {
  //mutation observer for labels
  get_cats();

  //call show more 
  show_more_less_events();

  //call category event listenrs
  categories_block_event_listners();

  //add mutation observer
  add_mutation_obsorver();

  //hamburgure click event 
  jQuery(document).on("click", ".header-sidebar-toggle .widget-button[aria-expanded=false]", function () {
    setTimeout(() => {
      get_cats();
      add_mutation_obsorver();
      categories_block_event_listners();
    }, 200);
  });
}); //domcontent event end

//add mutation obserever for cat dropdown
function add_mutation_obsorver() {
  const observer = new MutationObserver(list => {
    get_cats();
  });
  let element = document.querySelector(".sidebar-section-wrapper.sidebar-section[data-section-name=categories]");
  observer.observe(element, {
    attributes: true,
    childList: true,
    subtree: true
  });
  const observer_anchor = new MutationObserver(list => {
    //console.log('in mutation');
    let url_arr = window.location.href.split('/');
    let a_id = url_arr[url_arr.length - 1];
    jQuery(".cat_topics .topic_items a")?.removeClass("active");
    if (a_id) {
      jQuery(".cat_topics .topic_items a[data-topic-id=" + a_id + "]")?.addClass("active");
    }
  });
  let changed_elem = document.querySelector("#main-outlet");
  if (changed_elem != undefined) {
    observer_anchor.observe(changed_elem, {
      attributes: true,
      childList: true,
      subtree: true
    });
  }
}
function get_cats() {
  //console.log('get_cats');

  // if didnt fetched cats data before the fetch and store in global scope;
  if (cats_data == null) {
    jQuery.ajax({
      type: 'GET',
      url: window.location.origin + '/categories.json',
      success: function (data) {
        //console.log('cats found ajax');
        if (data.category_list.categories.length != 0) {
          //assign cats data
          cats_data = data;
          jQuery.each(data.category_list.categories, function (i, v) {
            let c_id = v.id;
            let c_slug = v.slug;
            let c_name = v.name;
            get_cat_tipics(c_id, c_slug, c_name);
          });
        }
      }
    });
  } else {
    jQuery.each(cats_data.category_list.categories, function (i, v) {
      let c_id = v.id;
      let c_slug = v.slug;
      let c_name = v.name;
      get_cat_tipics(c_id, c_slug, c_name);
    });
  }
}
function get_cat_tipics() {
  let c_id = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
  let c_slug = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
  let c_name = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
  //console.log('get_cat_tipics');

  if (jQuery(".sidebar-section[data-section-name=categories]").length > 0 && jQuery(".sidebar-section[data-section-name=categories] .sidebar-section-link-wrapper a[href*=" + c_slug + "]").length > 0) {
    if (jQuery(".sidebar-section[data-section-name=categories] .sidebar-section-link-wrapper a[href*=" + c_slug + "]").siblings(".cat_topics").length <= 0) {
      // if didnt fetched cat topics data before the fetch and store in global scope;
      if (cat_item_html[c_slug] == undefined) {
        jQuery.ajax({
          type: 'GET',
          url: window.location.origin + '/c/' + c_slug + '/' + c_id + '/l/latest.json',
          success: function (data) {
            //console.log('get_cat_tipics_ajax');
            let t_html = '<ul class ="cat_topics">';
            //counter to only show 10 topics in start
            let counter = 0;
            jQuery.each(data.topic_list.topics, function (index, value) {
              if (value.title != "") {
                //trim title if length > 23 chars
                let t_title = "";
                if (value.title.length >= 48) {
                  t_title = value.title.substring(0, 48) + "...";
                } else {
                  t_title = value.title;
                }
                //get aouthor and date data 

                let create_date = new Date(value.created_at);
                let month = create_date.toLocaleString('default', {
                  month: 'long'
                }).slice(0, 3);
                let year = create_date.getFullYear().toString().slice(-2);

                //get author data
                let user_id = "";
                let user_name = "";
                jQuery.each(value.posters, function (index, value) {
                  if (value.description.includes("Original Poster")) {
                    user_id = value.user_id;
                    jQuery.each(data.users, function (index, value) {
                      if (value.id == user_id) {
                        user_name = value.username;
                      }
                    });
                  }
                });
                let temp = '<div class="creator"> <a href="/u/' + user_name + '/summary" data-auto-route="true" >' + user_name + '</a> <a href="/t/' + value.slug + '/' + value.id + '"><span class="creation_date" >' + month + "   '" + year + '</span></a> </div>';
                if (counter < parseInt(settings.topic_list_count)) {
                  t_html += '<li class="topic_items"> <a href="/t/' + value.slug + '/' + value.id + '" role="heading" aria-level="2" class="title" data-topic-id="' + value.id + '"> ' + t_title + '</a>' + temp + '</li>';
                } else {
                  t_html += '<li class="topic_items topic_items_hidden"> <a href="/t/' + value.slug + '/' + value.id + '" role="heading" aria-level="2" class="title" data-topic-id="' + value.id + '"> ' + t_title + '</a>' + temp + ' </li>';
                }
              }
              counter++;
            });
            if (data.topic_list.topics.length > parseInt(settings.topic_list_count)) {
              t_html += '<li class="topic_items_load_more"> <p>Load more..</p> </li>';
              t_html += '<li class="topic_items_show_less hidden_btn"> <p>Show less..</p> </li>';
            }
            t_html += "</ul>";
            //store html in global scope 
            if (jQuery(".sidebar-section[data-section-name=categories] .sidebar-section-link-wrapper a[href*=" + c_slug + "]").siblings(".cat_topics").length == 0) {
              cat_item_html[c_slug] = t_html;
              jQuery(".sidebar-section[data-section-name=categories] .sidebar-section-link-wrapper a[href*=" + c_slug + "]").after(t_html);
            }
            if (jQuery(".sidebar-section[data-section-name=categories] .sidebar-section-link-wrapper > a[href*=" + c_slug + "] .cat_drop_down_icon").length == 0) {
              jQuery(".sidebar-section[data-section-name=categories] .sidebar-section-link-wrapper > a[href*=" + c_slug + "]").append('<span class="cat_drop_down_icon"><svg class="fa d-icon d-icon-angle-down svg-icon svg-string" xmlns="http://www.w3.org/2000/svg"><use href="#angle-down"></use></svg></span>');
            }
          }
        });
      } else {
        //IF ALREADY FETCHED DATA DISPLAY DATA
        //console.log("get_cat_tipics 3 else  ");
        if (jQuery(".sidebar-section[data-section-name=categories] .sidebar-section-link-wrapper a[href*=" + c_slug + "]").siblings(".cat_topics").length == 0) {
          jQuery(".sidebar-section[data-section-name=categories] .sidebar-section-link-wrapper a[href*=" + c_slug + "]").after(cat_item_html[c_slug]);
          if (jQuery(".sidebar-section[data-section-name=categories] .sidebar-section-link-wrapper > a[href*=" + c_slug + "] .cat_drop_down_icon").length == 0) {
            jQuery(".sidebar-section[data-section-name=categories] .sidebar-section-link-wrapper > a[href*=" + c_slug + "]").append('<span class="cat_drop_down_icon"><svg class="fa d-icon d-icon-angle-down svg-icon svg-string" xmlns="http://www.w3.org/2000/svg"><use href="#angle-down"></use></svg></span>');
          }
        }
      }
    }
  }
}

//show more less event listners
function show_more_less_events() {
  //load more event listner
  jQuery(document).on('click', '.topic_items_load_more', function (e) {
    e.preventDefault();
    let hidden_items = jQuery(e.target).closest('ul.cat_topics').find('li.topic_items_hidden');
    if (hidden_items.length > parseInt(settings.topic_list_count)) {
      let items = hidden_items.slice(0, parseInt(settings.topic_list_count));
      items.removeClass("topic_items_hidden");
    } else {
      hidden_items.removeClass("topic_items_hidden");
      if (e.target.nodeName.toLowerCase() != "li") {
        jQuery(e.target).parents("li").hide();
        jQuery(e.target).parents("li").siblings(".topic_items_show_less").show();
      } else {
        jQuery(e.target).hide();
        jQuery(e.target).siblings(".topic_items_show_less").show();
      }
    }
  });

  //show less event listner
  jQuery(document).on('click', '.topic_items_show_less', function (e) {
    e.preventDefault();
    let hidden_items = jQuery(e.target).parents('ul.cat_topics').children('li.topic_items');
    if (hidden_items.length > 10) {
      let items = hidden_items.slice(10, hidden_items.length);
      items.addClass("topic_items_hidden");
      if (e.target.nodeName.toLowerCase() != "li") {
        jQuery(e.target).parents("li").hide();
        jQuery(e.target).parents("li").siblings(".topic_items_load_more").show();
      } else {
        jQuery(e.target).hide();
        jQuery(e.target).siblings(".topic_items_load_more").show();
      }
    } else {
      jQuery(e.target).hide();
      jQuery(e.target).siblings(".topic_items_show_less").show();
    }
  });
  //dropdown click event
  jQuery(document).on("click", "#sidebar-section-content-categories .sidebar-section-link", function (e) {
    e.preventDefault();
    let clicked_elm = "";
    if (e.target.nodeName.toLowerCase() == "span" || e.target.nodeName.toLowerCase() == "svg" || e.target.nodeName.toLowerCase() == "use") {
      clicked_elm = jQuery(e.target).parents("a");
    } else {
      clicked_elm = e.target;
    }
    jQuery(clicked_elm).siblings('ul').toggle();
  });
}

//to show on mobile 
jQuery(document).on("click", ".header-dropdown-toggle.hamburger-dropdown", function (e) {
  setTimeout(() => {
    get_cats();
    show_more_less_events();
    add_mutation_obsorver();
    categories_block_event_listners();
  }, 200);
});
function categories_block_event_listners() {
  //click on main categories dropdowns desktop
  jQuery(document).on("click", ".sidebar-section[data-section-name=categories] button[aria-controls=sidebar-section-content-categories]", function () {
    get_cats();
  });

  //for mobile 
  jQuery(document).on("click", ".sidebar-hamburger-dropdown .sidebar-section[data-section-name=categories] .sidebar-section-header-wrapper", function (e) {
    get_cats();
    show_more_less_events();
  });
}






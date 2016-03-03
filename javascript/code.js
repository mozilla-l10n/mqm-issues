var issues, moz_issues;

var core, depth, source;

moz_issues = $.get('moz-issues.xml');
$.get('issues.xml').done(function(doc) {
    issues = doc;
    moz_issues.done(function(moz_doc) {
        Array.from(moz_doc.querySelectorAll('issue')).forEach(function(moz_issue) {
            var mqm_issue = issues.getElementById(moz_issue.id);
            for (var i=0, ii=moz_issue.attributes.length; i<ii; ++i) {
                var attr = moz_issue.attributes[i];
                if (attr.name !== 'id') {
                    if (attr.value !== 'no') {
                        mqm_issue.setAttribute(attr.name, attr.value);
                    }
                    else {
                        mqm_issue.removeAttribute(attr.name);
                    }
                }
            }
        });
        Array.prototype.forEach.call(issues.querySelectorAll('issue'),
            function(issue) {
                issue.depth = issue.parentElement.nodeName === 'issue' ?
                    issue.parentElement.depth + 1 : 0;
            }
        );
        $(document).ready(showIssues);
    });
});
$(document).ready(hookUpUx);

function showIssues() {
    depth = Number(document.forms.flags.depth.value);
    core = document.forms.flags.core.checked;
    source = document.forms.flags.source.checked;
    var container = $("#scorecard");
    Array.prototype.forEach.call(issues.querySelectorAll('issue'), function(issue) {
        renderIssue(issue, container);
    });
}
function renderIssue(issue, container) {
    var box = $('<div>').addClass('issue').addClass('depth-' + issue.depth);
    box.attr('id', issue.id);
    if (issue.hasAttribute('core')) {
        box.addClass('core');
    }
    else {
        if (core) box.hide();
    }
    box.addClass(issue.getAttribute('applies_to'));
    if (!box.hasClass('target') && !source) box.hide();
    if (issue.depth > depth) box.hide();
    $('<div>').addClass('name').text(issue.getAttribute('name')).appendTo(box);
    var innerbox = $('<div>').addClass('details');
    Array.from(issue.children).forEach(function(child) {
        switch (child.nodeName) {
            case 'definition': {
                var def = $('<div>').addClass('definition').text(child.textContent).appendTo(innerbox);
                //if (issue.depth) def.hide();
                break;
            }
            case 'examples': {
                Array.from(child.querySelectorAll('example')).forEach(function(example) {
                    $('<div>').addClass('example').html(example.innerHTML).hide().appendTo(innerbox);
                });
                break;
            }
            case 'notes': {
                Array.from(child.querySelectorAll('note')).forEach(function(note) {
                    $('<div>').addClass('note').html(note.innerHTML).hide().appendTo(innerbox);
                });
                break;
            }
        }
    });
    box.append(innerbox);
    box.appendTo(container);
}

function refilter(evt) {
    var target = evt.target;
    switch (target.id) {
        case 'depth': {
            var newdepth = Number(target.value);
            if (newdepth == depth) return;
            if (newdepth > depth) {
                // show more issues
                var ids = Array.prototype.filter.call(
                    issues.querySelectorAll('issue'),
                    function (issue) {
                        if (core && !issue.hasAttribute('core')) return false;
                        if (!source && issue.getAttribute('applies_to').indexOf('target') < 0) return false;
                        return issue.depth > depth && issue.depth <= newdepth;
                    }
                ).map(function (issue) {return "#" + issue.id;});
                $(ids.join(",")).slideDown(200);
            }
            else {
                // hide some issues
                for (;depth > newdepth; --depth) {
                    $(".issue:not(:hidden).depth-" + depth).slideUp(200);
                }
            }
            depth = newdepth;
            break;
        }
        case 'core': {
            core = target.checked;
            if (core) {
                $(".issue:not(.core)").slideUp(200);
            }
            else {
                for (var d = 0; d <= depth; ++d) {
                    $(".issue:not(.core).depth-" + d + 
                        (!source ? ':not(.target)': '')
                    ).slideDown(200);
                }
            }
            break;
        }
        case 'source': {
            source = target.checked;
            if (!source) {
                $(".issue:not(.target):not(:hidden)").slideUp(200);
            }
            else {
                for (var d = 0; d <= depth; ++d) {
                    $(".issue:not(.target).depth-" + d + 
                        (core ? '.core': '')
                    ).slideDown(200);
                }
            }
            break;
        }
    }
}

function hookUpUx() {
    $("#scorecard").click(onSelectIssue);
    document.forms.flags.onchange = refilter;
}
function onSelectIssue(e) {
    var target = e.target;
    // find issue
    while (target && !target.classList.contains('issue') && target !== this) {
        target = target.parentElement;
    }
    var current = this.querySelector('.activated');
    if (current) {
        current.classList.remove('activated');
        $(current).find('.example').slideUp();
        $(current).find('.note').slideUp();
    }
    if (current !== target && target.classList.contains('issue')) {
        target.classList.add('activated');
        $(target).find('.example').slideDown();
        $(target).find('.note').slideDown();
        $(target).find('.definition').show();
    }
}

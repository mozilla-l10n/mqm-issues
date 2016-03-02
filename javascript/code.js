var issues, moz_issues;

var core = true, depth = 2, applies=['.target'];
function collection() {
    var q = $("#scorecard .issue");
    if (core) {
        q = q.filter(".core");
    }
    if (depth) {
        var _depth = depth,selector=[];
        while (_depth>=0) {
            selector.push('.depth-' + _depth);
            _depth--;
        }
        q = q.filter(selector.join(','));
    }
    if (applies.length) {
        q = q.filter(applies.join(','));
    }
    return q;
}

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
    var container = $("#scorecard");
    Array.from(issues.documentElement.children).forEach(function(issue) {
        renderIssue(issue, container, 0);
    });
}
function renderIssue(issue, container, depth) {
    var box = $('<div>').addClass('issue').addClass('depth-' + depth);
    box.attr('id', issue.id);
    box.addClass(issue.hasAttribute('core') ? 'core' : 'not-core');
    box.addClass(issue.getAttribute('applies_to'));
    box.appendTo(container);
    $('<div>').addClass('name').text(issue.getAttribute('name')).appendTo(box);
    var innerbox = $('<div>').addClass('details');
    Array.from(issue.children).forEach(function(child) {
        switch (child.nodeName) {
            case 'issue': {
                renderIssue(child, container, depth + 1);
                break;
            }
            case 'definition': {
                $('<div>').addClass('definition').text(child.textContent).appendTo(innerbox);
                break;
            }
            case 'examples': {
                Array.from(child.querySelectorAll('example')).forEach(function(example) {
                    $('<div>').addClass('example').text(example.textContent).appendTo(innerbox);
                });
                break;
            }
        }
    });
    box.append(innerbox);
}

function hookUpUx() {
    $("#scorecard").click(onSelectIssue);
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
    }
    if (current !== target && target.classList.contains('issue')) {
        target.classList.add('activated');
        $(target).find('.example').slideDown();
    }
}

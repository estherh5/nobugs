/* Automatic holiday hours for the Contact page.
 *
 * NoBugs! closes for six holidays a year. Instead of editing the page by hand a
 * few days beforehand and again the morning after, this file works the dates
 * out for any year and posts the notice on its own — from LEAD_DAYS before the
 * holiday through the end of the day itself, then it disappears.
 *
 * None of it needs yearly upkeep. For anything that isn't one of the six — a
 * snow day, an early close, a shortened Christmas Eve — add a line to ONE_OFFS
 * below and it will take care of itself the same way. */

(function () {
  'use strict';

  var LEAD_DAYS = 7;              // how far ahead a notice goes up
  var ZONE = 'America/New_York';  // the shop's clock, never the visitor's


  /* One-off closures and special hours.
   *
   * Each entry needs the text to display and either a single `date` or a
   * `from`/`to` range, written as YYYY-MM-DD:
   *
   *   { date: '2027-01-04', text: 'Monday, January 4: Closed due to snow' },
   *   { date: '2026-12-24', text: 'Christmas Eve (Thursday, December 24): 7:30 AM - 2:00 PM' },
   *   { from: '2027-02-01', to: '2027-02-14', text: 'Temporarily 7:15 AM - 5:30 PM - call first' },
   *
   * Like a holiday, a one-off appears LEAD_DAYS ahead and clears itself once
   * the date has passed. Leaving an old entry here does no harm; tidy them up
   * whenever you're next in the file. */
  var ONE_OFFS = [
  ];


  /* The six annual closures. Each `on` returns that holiday's date in a given
   * year, so the list never has to be rewritten. */
  var MONDAY = 1, THURSDAY = 4, LAST = -1;

  var HOLIDAYS = [
    { name: "New Year's Day",   on: fixed(1, 1) },
    { name: 'Memorial Day',     on: weekdayOf(5, MONDAY, LAST) },
    { name: 'Independence Day', on: fixed(7, 4) },
    { name: 'Labor Day',        on: weekdayOf(9, MONDAY, 1) },
    { name: 'Thanksgiving',     on: weekdayOf(11, THURSDAY, 4) },
    { name: 'Christmas',        on: fixed(12, 25) }
  ];


  var WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday',
    'Friday', 'Saturday'];

  var MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];


  // A holiday that falls on the same calendar date every year.
  function fixed(month, day) {
    return function (year) {
      return { y: year, m: month, d: day };
    };
  }

  // A holiday pinned to a weekday instead: the 1st Monday, the 4th Thursday,
  // or — with n set to LAST — the last Monday of the month.
  function weekdayOf(month, weekday, n) {
    return function (year) {
      if (n === LAST) {
        // Day 0 of the following month is the last day of this one.
        var end = new Date(Date.UTC(year, month, 0));
        return {
          y: year,
          m: month,
          d: end.getUTCDate() - ((end.getUTCDay() - weekday + 7) % 7)
        };
      }
      var firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
      return {
        y: year,
        m: month,
        d: 1 + ((weekday - firstWeekday + 7) % 7) + (n - 1) * 7
      };
    };
  }

  /* Dates are compared as whole day counts rather than Date objects, so a
   * holiday is a holiday no matter what hour or time zone it is read in. */
  function dayNumber(date) {
    return Math.round(Date.UTC(date.y, date.m - 1, date.d) / 86400000);
  }

  function parseDate(iso) {
    var parts = iso.split('-');
    return { y: +parts[0], m: +parts[1], d: +parts[2] };
  }

  // "Christmas (Friday, December 25): Closed"
  function label(name, date) {
    var weekday = WEEKDAY_NAMES[new Date(Date.UTC(date.y, date.m - 1, date.d)).getUTCDay()];
    return name + ' (' + weekday + ', ' + MONTH_NAMES[date.m - 1] + ' ' + date.d + '): Closed';
  }


  /* Every notice that belongs on the page on a given day, soonest first.
   * Christmas and New Year's are seven days apart, so both can show at once. */
  function noticesOn(today, oneOffs) {
    var now = dayNumber(today);
    var notices = [];

    // This year and next, so a notice posted in late December still reaches
    // New Year's Day.
    [today.y, today.y + 1].forEach(function (year) {
      HOLIDAYS.forEach(function (holiday) {
        var date = holiday.on(year);
        var day = dayNumber(date);
        notices.push({ start: day, end: day, text: label(holiday.name, date) });
      });
    });

    (oneOffs || ONE_OFFS).forEach(function (entry) {
      notices.push({
        start: dayNumber(parseDate(entry.from || entry.date)),
        end: dayNumber(parseDate(entry.to || entry.date)),
        text: entry.text
      });
    });

    return notices
      .filter(function (notice) {
        return now >= notice.start - LEAD_DAYS && now <= notice.end;
      })
      .sort(function (a, b) { return a.start - b.start; })
      .map(function (notice) { return notice.text; });
  }

  // Today's date in Philadelphia, whatever clock the visitor's device keeps.
  function todayInZone() {
    try {
      // en-CA formats as YYYY-MM-DD.
      return parseDate(new Intl.DateTimeFormat('en-CA', {
        timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit'
      }).format(new Date()));
    } catch (error) {
      // A browser too old for time zones falls back to its own date, which is
      // never more than a few hours out.
      var local = new Date();
      return { y: local.getFullYear(), m: local.getMonth() + 1, d: local.getDate() };
    }
  }

  // The dates and wording for a whole year — used by the tests, and handy in
  // the console for checking a year ahead.
  function datesFor(year) {
    return HOLIDAYS.map(function (holiday) {
      var date = holiday.on(year);
      return { name: holiday.name, date: date, text: label(holiday.name, date) };
    });
  }


  function escapeHtml(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* Each notice is added as its own line under the regular hours, in the same
   * red `.special` styling the hand-written ones used. With nothing to show,
   * the slot stays empty and the hours block closes up as if it weren't there. */
  function render() {
    var slot = document.getElementById('special-hours');
    if (!slot) { return; }

    slot.innerHTML = noticesOn(todayInZone()).map(function (text) {
      return '<br><b class="special">' + escapeHtml(text) + '</b>';
    }).join('');
  }


  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { noticesOn: noticesOn, datesFor: datesFor, LEAD_DAYS: LEAD_DAYS };
  } else {
    render();
  }
}());

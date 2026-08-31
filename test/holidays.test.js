/* Tests for holidays.js. No dependencies — run it with:
 *
 *   node test/holidays.test.js
 *
 * The expected dates below were worked out independently of holidays.js (from
 * Python's calendar module) and cross-checked against the wording of the
 * hand-written notices in this repository's own history. */

var assert = require('assert');
var holidays = require('../holidays.js');

var failures = 0;

function test(name, run) {
  try {
    run();
    console.log('  ok   ' + name);
  } catch (error) {
    failures++;
    console.log('  FAIL ' + name + '\n       ' + error.message.replace(/\n/g, '\n       '));
  }
}

function on(iso) {
  var parts = iso.split('-');
  return { y: +parts[0], m: +parts[1], d: +parts[2] };
}


/* ---- The six dates, six years out -------------------------------------- */

var EXPECTED = {
  2026: ["New Year's Day|2026-01-01|Thursday", 'Memorial Day|2026-05-25|Monday',
    'Independence Day|2026-07-04|Saturday', 'Labor Day|2026-09-07|Monday',
    'Thanksgiving|2026-11-26|Thursday', 'Christmas|2026-12-25|Friday'],
  2027: ["New Year's Day|2027-01-01|Friday", 'Memorial Day|2027-05-31|Monday',
    'Independence Day|2027-07-04|Sunday', 'Labor Day|2027-09-06|Monday',
    'Thanksgiving|2027-11-25|Thursday', 'Christmas|2027-12-25|Saturday'],
  2028: ["New Year's Day|2028-01-01|Saturday", 'Memorial Day|2028-05-29|Monday',
    'Independence Day|2028-07-04|Tuesday', 'Labor Day|2028-09-04|Monday',
    'Thanksgiving|2028-11-23|Thursday', 'Christmas|2028-12-25|Monday'],
  2029: ["New Year's Day|2029-01-01|Monday", 'Memorial Day|2029-05-28|Monday',
    'Independence Day|2029-07-04|Wednesday', 'Labor Day|2029-09-03|Monday',
    'Thanksgiving|2029-11-22|Thursday', 'Christmas|2029-12-25|Tuesday'],
  2030: ["New Year's Day|2030-01-01|Tuesday", 'Memorial Day|2030-05-27|Monday',
    'Independence Day|2030-07-04|Thursday', 'Labor Day|2030-09-02|Monday',
    'Thanksgiving|2030-11-28|Thursday', 'Christmas|2030-12-25|Wednesday'],
  2031: ["New Year's Day|2031-01-01|Wednesday", 'Memorial Day|2031-05-26|Monday',
    'Independence Day|2031-07-04|Friday', 'Labor Day|2031-09-01|Monday',
    'Thanksgiving|2031-11-27|Thursday', 'Christmas|2031-12-25|Thursday']
};

console.log('\nHoliday dates');

Object.keys(EXPECTED).forEach(function (year) {
  test(year + ' falls on the right days', function () {
    var actual = holidays.datesFor(+year).map(function (holiday) {
      var iso = holiday.date.y + '-' +
        ('0' + holiday.date.m).slice(-2) + '-' +
        ('0' + holiday.date.d).slice(-2);
      // The weekday is read back out of the rendered text, so a correct date
      // paired with the wrong weekday name still fails.
      var weekday = holiday.text.match(/\((\w+),/)[1];
      return holiday.name + '|' + iso + '|' + weekday;
    });
    assert.deepStrictEqual(actual, EXPECTED[year]);
  });
});

test('wording matches the notices written by hand', function () {
  var texts = holidays.datesFor(2026).map(function (h) { return h.text; });
  // These four ran on the site in 2020, which shares 2026's calendar.
  assert.ok(texts.indexOf('Memorial Day (Monday, May 25): Closed') !== -1, 'Memorial Day');
  assert.ok(texts.indexOf('Labor Day (Monday, September 7): Closed') !== -1, 'Labor Day');
  assert.ok(texts.indexOf('Thanksgiving (Thursday, November 26): Closed') !== -1, 'Thanksgiving');
  assert.ok(texts.indexOf('Christmas (Friday, December 25): Closed') !== -1, 'Christmas');
});


/* ---- When a notice is on the page -------------------------------------- */

console.log('\nVisibility window');

test('is absent 8 days before', function () {
  assert.deepStrictEqual(holidays.noticesOn(on('2026-11-18'), []), []);
});

test('goes up exactly 7 days before', function () {
  assert.deepStrictEqual(holidays.noticesOn(on('2026-11-19'), []),
    ['Thanksgiving (Thursday, November 26): Closed']);
});

test('is still up the day before', function () {
  assert.deepStrictEqual(holidays.noticesOn(on('2026-11-25'), []),
    ['Thanksgiving (Thursday, November 26): Closed']);
});

test('is up on the day itself', function () {
  assert.deepStrictEqual(holidays.noticesOn(on('2026-11-26'), []),
    ['Thanksgiving (Thursday, November 26): Closed']);
});

test('is gone the morning after', function () {
  assert.deepStrictEqual(holidays.noticesOn(on('2026-11-27'), []), []);
});

test('an ordinary day shows nothing at all', function () {
  assert.deepStrictEqual(holidays.noticesOn(on('2026-03-17'), []), []);
});

test('LEAD_DAYS is the 7 days the window is built on', function () {
  assert.strictEqual(holidays.LEAD_DAYS, 7);
});


/* ---- Christmas and New Year's overlap ---------------------------------- */

console.log("\nChristmas into New Year's");

test('Christmas alone a week out', function () {
  assert.deepStrictEqual(holidays.noticesOn(on('2026-12-20'), []),
    ['Christmas (Friday, December 25): Closed']);
});

test('both show once New Year\'s comes into range, soonest first', function () {
  assert.deepStrictEqual(holidays.noticesOn(on('2026-12-25'), []), [
    'Christmas (Friday, December 25): Closed',
    "New Year's Day (Friday, January 1): Closed"
  ]);
});

test('New Year\'s carries over into the next year on its own', function () {
  assert.deepStrictEqual(holidays.noticesOn(on('2026-12-28'), []),
    ["New Year's Day (Friday, January 1): Closed"]);
});

test("New Year's Day itself, read from the new year", function () {
  assert.deepStrictEqual(holidays.noticesOn(on('2027-01-01'), []),
    ["New Year's Day (Friday, January 1): Closed"]);
});

test('the page is clear again on January 2', function () {
  assert.deepStrictEqual(holidays.noticesOn(on('2027-01-02'), []), []);
});


/* ---- One-off entries ---------------------------------------------------- */

console.log('\nOne-offs');

var SNOW = [{ date: '2027-03-05', text: 'Friday, March 5: Closed due to snow' }];

test('a single-day one-off keeps the same 7-day window', function () {
  assert.deepStrictEqual(holidays.noticesOn(on('2027-02-25'), SNOW), []);
  assert.deepStrictEqual(holidays.noticesOn(on('2027-02-26'), SNOW), [SNOW[0].text]);
  assert.deepStrictEqual(holidays.noticesOn(on('2027-03-05'), SNOW), [SNOW[0].text]);
  assert.deepStrictEqual(holidays.noticesOn(on('2027-03-06'), SNOW), []);
});

var TEMPORARY = [{
  from: '2027-02-01', to: '2027-02-14',
  text: 'Temporarily 7:15 AM - 5:30 PM - call first'
}];

test('a range one-off stays up for its whole run', function () {
  assert.deepStrictEqual(holidays.noticesOn(on('2027-01-24'), TEMPORARY), []);
  assert.deepStrictEqual(holidays.noticesOn(on('2027-01-25'), TEMPORARY), [TEMPORARY[0].text]);
  assert.deepStrictEqual(holidays.noticesOn(on('2027-02-07'), TEMPORARY), [TEMPORARY[0].text]);
  assert.deepStrictEqual(holidays.noticesOn(on('2027-02-14'), TEMPORARY), [TEMPORARY[0].text]);
  assert.deepStrictEqual(holidays.noticesOn(on('2027-02-15'), TEMPORARY), []);
});

test('a one-off sorts in beside a holiday it clashes with', function () {
  var eve = [{ date: '2026-12-24', text: 'Christmas Eve (Thursday, December 24): 7:30 AM - 2:00 PM' }];
  assert.deepStrictEqual(holidays.noticesOn(on('2026-12-24'), eve), [
    'Christmas Eve (Thursday, December 24): 7:30 AM - 2:00 PM',
    'Christmas (Friday, December 25): Closed'
  ]);
});

test('an expired one-off is ignored rather than shown', function () {
  var stale = [{ date: '2019-01-04', text: 'January 4, 2019: Closed due to snow' }];
  assert.deepStrictEqual(holidays.noticesOn(on('2026-03-17'), stale), []);
});


/* ------------------------------------------------------------------------- */

console.log('');
if (failures) {
  console.log(failures + ' failing\n');
  process.exit(1);
}
console.log('All tests passed.\n');

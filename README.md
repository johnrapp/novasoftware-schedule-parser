# Novasoftware Schedule Parser

This project hosts the paper and implementation code for my final High School Essay.

## Paper
The files for the paper are contained in the `paper` directory, where the actual paper document may be found as [`paper.pdf`](https://github.com/johnrapp/novasoftware-schedule-parser/blob/master/paper/paper.pdf).

The paper is written in LaTeX, with the source code in the file [`paper.tex`](https://github.com/johnrapp/novasoftware-schedule-parser/blob/master/paper/paper.tex).

## Implementation

### Installation
The implementation requires Node.js which may be downloaded and installed from the [Node.js website](https://nodejs.org/en/download/).

Next, download or `git clone` this repository.

Install the necessary dependencies by navigating to the project root directory and running the following command in the terminal
```sh
$ npm install
```

### Usage

To run the program navigate to the project root directory and execute
```sh
$ node .
```
This will dowload the schedules specified in `config.json` and placing them `schedules` directory. The first level in the `schedules` directory contains the weeks while the next level contains the schedules (e.g the schedule for 13TE week 15 is found at `schedules/15/13TE.json`).

#### `config.json`
The program may be configured using the `config.json` file. The default config looks as such

```json
{
	"schoolId": 99810,
	"schoolCode": 945537,
	"classes": [
		"13TE",
		"13ESMU"
	],
	"weeks": [
		15, 16
	]
}
```
The properties of the config object are
* **schoolId** - `{number}` - The school id, found in the URL query string as `schoolid`
* **schoolCode** - `{number}` - The school code, found in the URL query string as `code`
* **classes** - `{[string]|'*'}` - The array of class names. If the string `'*'` instead is provided, all classes will be included
* **weeks** - `{[number]|'*'}` - The array of weeks. The string `'*'` means all weeks
* **requestTimeout** - `{number}` - Optional. The timeout between requests

If no `schoolId` or `schoolCode` is provided, the program will use the ID and code of Värmdö Gymnasium.
##### School IDs and codes
The  school ids and codes of some schools (in no particular order or reason for selection) are presented in the table bewlow. The third column indicates whether or not the program has successfully parsed schedules from the school. A check provides no guarantee that the parsing process works. If the parsing process produces an error, adjustments may have to be made to the source code.

| School                    | schoolId | schoolCode | Tested |
|---------------------------|----------|------------|:------:|
| Värmdö Gymnasium          | 99810    | 945537     |    ✓   |
| Östra Real                | 59150    | 522626     |    ✓   |
| Tyresö Gymnasium          | 27820    | 519876     |    ✓   |
| Sundsta-Älvkullegymnasiet | 18200    | 993161     |    ✓   |
| Norra Real                | 81530    | 123489     |    ✕   |
| Katedralskolan i Uppsala  | 68600    | 12689      |    ✕   |
| Thorildsplans gymnasium   | 80710    | 211677     |    ✕   |

### Code
The implementation is written in JavaScript for Node.js.

The main parsing logic is contained in [`parse-lessons.js`](https://github.com/johnrapp/novasoftware-schedule-parser/blob/master/parse-lessons.js).

[`novasoftware.js`](https://github.com/johnrapp/novasoftware-schedule-parser/blob/master/novasoftware.js) contains the HTTP requests.

Adjustments can be made primarily to `parse-lessons.js` and `scrapeClickedLesson(body)` in `novasoftware.js`.

### Demo
The process described in the process and implemented in this project powers the schedule viewing application [vgy.rocks/schema](http://vgy.rocks/schema) for Värmdö Gymnasium. The repository for this application may be found [here](https://github.com/johnrapp/schedule-parser/).

## License
GNU General Public License v3.0, see [LICENCE](https://github.com/johnrapp/novasoftware-schedule-parser/blob/master/LICENSE)

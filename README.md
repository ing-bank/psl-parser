# psl-parser

Implementation of a Profile Scripting Language Parser in TypeScript.

## Usage

```javascript
import { parseText } from 'psl-parser';

const parsedPsl = parseText(/* PSL source text */);

parsedPsl.methods.forEach(method => {
    console.log(method.id.value);
})
```

## Development

If you would like to join the development of this project, you will need to
install [node.js] (with npm) in order to install the dependencies.

Once you clone the project, from the command line in the root of this project,
run `npm install`.

## History

This project was originally developed under [ing-bank/vscode-psl] repository,
in order to preserve that history this project was cloned from
[ing-bank/vscode-psl] and only code relevant to the psl-parser was retained.
Please refer to the [split commit] for details.

[split commit]: https://github.com/ing-bank/psl-parser/commit/4814107ce1840d92c2ab0de99e31887014453d4c
[ing-bank/vscode-psl]: https://github.com/ing-bank/vscode-psl.git
[node.js]: https://nodejs.org/en

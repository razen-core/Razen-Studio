function registerRazenLanguage() {
    monaco.languages.register({
        id: 'razen',
        extensions: ['.ryx'],
        aliases: ['Ryx', 'ryx', 'Razen', 'razen'],
    });

    monaco.languages.setLanguageConfiguration('razen', {
        comments: {
            lineComment: '//',
            blockComment: ['/*', '*/'],
        },
        brackets: [
            ['{', '}'],
            ['[', ']'],
            ['(', ')'],
        ],
        autoClosingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"' },
            { open: "'", close: "'" },
            { open: '/*', close: ' */', notIn: ['string'] },
        ],
        surroundingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"' },
            { open: "'", close: "'" },
        ],
    });

    monaco.languages.setMonarchTokensProvider('razen', {
        // ── Keywords ──────────────────────────────────────────────────────────
        keywords: [
            // Variables & State
            'mut', 'const', 'shared',
            // Types & Structures
            'struct', 'enum', 'trait', 'impl', 'alias',
            // Functions & Modules
            'act', 'retn', 'use', 'pub',
            // Control Flow
            'if', 'else', 'loop', 'break', 'next', 'match', 'guard',
            // Error & Resource
            'defer',
            // Concurrency
            'async', 'await',
            // Memory
            'unsafe',
            // Operators / Special
            'in', 'as', 'is', 'self',
            // Booleans
            'true', 'false',
            // Option/Result variants
            'some', 'none', 'ok', 'err',
        ],

        // ── Primitive Types ────────────────────────────────────────────────────
        typeKeywords: [
            'bool', 'int', 'uint', 'float', 'str', 'bytes', 'void', 'tensor',
        ],

        // ── Built-in Generic Collections (used like vec[T], map[K,V], …) ──────
        collectionTypes: [
            'vec', 'map', 'set', 'option', 'result',
        ],

        // ── Operators ─────────────────────────────────────────────────────────
        operators: [
            ':=', '=',
            '==', '!=', '<', '>', '<=', '>=',
            '&&', '||',
            '+', '-', '*', '/', '%', '**',
            '&', '|', '^', '~', '<<', '>>',
            '->', '~>',
            '..', '..=',
            '?', '!',
            ':',
        ],

        symbols: /[=><!~?:&|+\-*\/\^%\.]+/,
        escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

        // ── Tokenizer ─────────────────────────────────────────────────────────
        tokenizer: {
            root: [
                // ── Block comments ──
                [/\/\*/, { token: 'comment', next: '@block_comment' }],

                // ── Line comments ──
                [/\/\/.*$/, 'comment'],

                // ── Whitespace ──
                [/[ \t\r\n]+/, ''],

                // ── Numbers ──
                [/0[xX][0-9a-fA-F_]+/, 'number.hex'],
                [/0[bB][01_]+/, 'number.binary'],
                [/0[oO][0-7_]+/, 'number.octal'],
                [/\d[\d_]*\.\d[\d_]*([eE][-+]?\d+)?/, 'number.float'],
                [/\d[\d_]*[uU]?/, 'number'],

                // ── Raw strings: r"…" ──
                [/r"[^"]*"/, 'string'],

                // ── Interpolated strings: "… {expr} …" ──
                [/"/, { token: 'string.quote', bracket: '@open', next: '@interp_string' }],

                // ── Char literals ──
                [/'[^\\']'/, 'string.char'],
                [/(')(@escapes)(')/, ['string.char', 'string.escape', 'string.char']],

                // ── Type annotation context after identifier: name type ──
                [/[a-zA-Z_]\w*(?=\s*:=)/, 'identifier'],

                // ── Function / action declarations ──
                [/\b(act)\b/, { token: 'keyword', next: '@function_declaration' }],

                // ── use statement ──
                [/\buse\b/, { token: 'keyword', next: '@use_statement' }],

                // ── Identifiers, keywords, types ──
                [/[a-zA-Z_]\w*/, {
                    cases: {
                        '@keywords': 'keyword',
                        '@typeKeywords': 'type.identifier',
                        '@collectionTypes': 'type.identifier',
                        '@default': 'identifier',
                    }
                }],

                // ── Brackets ──
                [/[{}()\[\]]/, '@brackets'],

                // ── Operators & symbols ──
                [/@symbols/, {
                    cases: {
                        '@operators': 'operator',
                        '@default': 'delimiter',
                    }
                }],

                // ── Delimiters ──
                [/[;,.]/, 'delimiter'],
            ],

            // ── Block comment state ────────────────────────────────────────────
            block_comment: [
                [/[^/*]+/, 'comment'],
                [/\/\*/, 'comment', '@push'],
                [/\*\//, 'comment', '@pop'],
                [/[/*]/, 'comment'],
            ],

            // ── Interpolated string: supports {expr} inside "…" ───────────────
            interp_string: [
                [/{/, { token: 'delimiter.curly', next: '@string_interpolation' }],
                [/@escapes/, 'string.escape'],
                [/\\./, 'string.escape.invalid'],
                [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }],
                [/[^"\\{]+/, 'string'],
            ],

            string_interpolation: [
                [/}/, { token: 'delimiter.curly', next: '@pop' }],
                { include: 'root' },
            ],

            // ── Function declaration: act <name>(<params>) <RetType> ───────────
            function_declaration: [
                [/\s+/, ''],
                [/[a-zA-Z_]\w*/, 'entity.name.function'],
                [/\(/, { token: '@brackets', next: '@parameter_list' }],
                [/\[/, { token: '@brackets', next: '@generic_params' }],
                [/:/, { token: 'operator', next: '@type_annotation' }],
                ['', '', '@pop'],
            ],

            // ── Parameter list: (name type, …) ───────────────────────────────
            parameter_list: [
                [/\(/, { token: '@brackets', next: '@push' }],
                [/\)/, { token: '@brackets', next: '@pop' }],
                [/\bself\b/, 'keyword'],
                [/[a-zA-Z_]\w*/, {
                    cases: {
                        '@typeKeywords': 'type.identifier',
                        '@collectionTypes': 'type.identifier',
                        '@keywords': 'keyword',
                        '@default': 'identifier',
                    }
                }],
                [/,/, 'delimiter'],
                [/\s+/, ''],
            ],

            // ── Generic params: [T, K, V] ─────────────────────────────────────
            generic_params: [
                [/>/, { token: 'delimiter.angle', bracket: '@close', next: '@pop' }],
                [/\]/, { token: '@brackets', next: '@pop' }],
                [/[a-zA-Z_]\w*/, {
                    cases: {
                        '@typeKeywords': 'type.identifier',
                        '@collectionTypes': 'type.identifier',
                        '@default': 'identifier',
                    }
                }],
                [/,/, 'delimiter'],
                [/\s+/, ''],
            ],

            // ── Type annotation after : ───────────────────────────────────────
            type_annotation: [
                [/\s+/, ''],
                [/[a-zA-Z_]\w*/, {
                    cases: {
                        '@typeKeywords': { token: 'type.identifier', next: '@pop' },
                        '@collectionTypes': { token: 'type.identifier', next: '@pop' },
                        '@default': { token: 'identifier', next: '@pop' },
                    }
                }],
                ['', '', '@pop'],
            ],

            // ── use statement: use std.io ─────────────────────────────────────
            use_statement: [
                [/\s+/, ''],
                [/[a-zA-Z_][\w.]*/, { token: 'entity.name.library', next: '@pop' }],
                [/"/, { token: 'string.quote', bracket: '@open', next: '@string_lib_pop' }],
                ['', '', '@pop'],
            ],

            string_lib_pop: [
                [/[^\\"]+/, 'string'],
                [/@escapes/, 'string.escape'],
                [/\\./, 'string.escape.invalid'],
                [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }],
            ],

            // ── Handle_type_annotation_colon (legacy helper) ─────────────────
            handle_type_annotation_colon: [
                [/:/, { token: 'operator', next: '@type_annotation' }],
                ['', '', '@pop'],
            ],
        }
    });

    // ── Themes ────────────────────────────────────────────────────────────────

    monaco.editor.defineTheme('razen-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'comment',              foreground: '608B4E' },
            { token: 'entity.name.library',  foreground: '98C379' },
            { token: 'entity.name.function', foreground: 'FFF59D' },
            { token: 'type.identifier',      foreground: '4EC9B0' },
            { token: 'string',               foreground: 'CE9178' },
            { token: 'string.escape',        foreground: 'D7BA7D' },
            { token: 'keyword',              foreground: 'C586C0' },
            { token: 'operator',             foreground: 'D4D4D4' },
            { token: 'number',               foreground: 'B5CEA8' },
            { token: 'number.float',         foreground: 'B5CEA8' },
            { token: 'number.hex',           foreground: 'B5CEA8' },
            { token: 'number.binary',        foreground: 'B5CEA8' },
            { token: 'number.octal',         foreground: 'B5CEA8' },
            { token: 'delimiter',            foreground: 'D4D4D4' },
            { token: 'delimiter.curly',      foreground: 'FFCC00' },
        ],
        colors: {
            'editor.background': '#1e1e2e',
            'editor.foreground': '#d4d4d4',
        }
    });

    monaco.editor.defineTheme('razen-light', {
        base: 'vs',
        inherit: true,
        rules: [
            { token: 'comment',              foreground: '6A9955' },
            { token: 'entity.name.library',  foreground: '2E8B57' },
            { token: 'entity.name.function', foreground: '795E26' },
            { token: 'type.identifier',      foreground: '267F99' },
            { token: 'string',               foreground: 'A31515' },
            { token: 'string.escape',        foreground: 'CD7B04' },
            { token: 'keyword',              foreground: '0000FF' },
            { token: 'operator',             foreground: '000000' },
            { token: 'number',               foreground: '098658' },
            { token: 'number.float',         foreground: '098658' },
            { token: 'number.hex',           foreground: '098658' },
            { token: 'number.binary',        foreground: '098658' },
            { token: 'number.octal',         foreground: '098658' },
            { token: 'delimiter',            foreground: '000000' },
            { token: 'delimiter.curly',      foreground: '9A0000' },
        ],
        colors: {
            'editor.background': '#ffffff',
            'editor.foreground': '#000000',
        }
    });
}

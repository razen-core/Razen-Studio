function registerRazenLanguage() {
    const razenStdLibs = {
        'array': ['push', 'pop', 'shift', 'unshift', 'slice', 'splice', 'concat', 'join', 'index_of', 'last_index_of', 'includes', 'reverse', 'sort', 'map', 'filter', 'reduce', 'every', 'some', 'find', 'find_index', 'fill', 'length'],
        'string': ['upper', 'lower', 'capitalize', 'substring', 'replace', 'replace_all', 'trim', 'trim_start', 'trim_end', 'starts_with', 'ends_with', 'includes', 'split', 'repeat', 'pad_start', 'pad_end', 'char_at', 'code_point_at', 'from_char_code', 'length'],
        'math': ['add', 'subtract', 'multiply', 'divide', 'modulo', 'power', 'sqrt', 'abs', 'round', 'floor', 'ceil', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2', 'log', 'exp', 'min', 'max', 'clamp', 'lerp', 'random', 'random_int', 'random_float', 'mean', 'median', 'mode', 'variance', 'stddev'],
        'datetime': ['now', 'parse', 'format', 'year', 'month', 'day', 'hour', 'minute', 'second', 'millisecond', 'weekday', 'weekday_name', 'is_leap_year', 'days_in_month', 'add_days', 'add_months', 'add_years', 'add_hours', 'add_minutes', 'add_seconds', 'diff_days', 'diff_months', 'diff_years', 'to_timestamp', 'from_timestamp'],
        'random': ['seed', 'int', 'float', 'choice', 'shuffle', 'sample', 'random', 'weighted_choice', 'uuid', 'gaussian', 'noise'],
        'filesystem': ['exists', 'is_file', 'is_dir', 'create_file', 'create_dir', 'remove', 'read_file', 'write_file', 'append_file', 'list_dir', 'copy_file', 'copy_dir', 'move_file', 'delete_file', 'delete_dir', 'absolute_path', 'relative_path', 'extension', 'file_stem', 'parent_dir', 'join_path', 'current_dir', 'change_dir', 'temp_file', 'temp_dir', 'metadata', 'read_json', 'write_json'],
        'json': ['parse', 'stringify', 'validate', 'minify', 'pretty_print'],
        'network': ['get', 'post', 'put', 'delete', 'patch', 'head', 'options', 'fetch', 'download_file', 'upload_file', 'ping', 'resolve_dns', 'get_ip', 'url_encode', 'url_decode', 'build_query', 'parse_query', 'create_api', 'execute_api', 'parse_json', 'to_json', 'is_success', 'is_client_error', 'is_server_error', 'websocket_connect', 'websocket_send', 'websocket_receive', 'websocket_close', 'form_data', 'multipart_data'],
        'system': ['getpid', 'getcwd', 'execute', 'getenv', 'setenv', 'environ', 'args', 'path_exists', 'realpath', 'exit', 'sleep', 'hostname', 'username', 'uptime', 'os_type', 'os_release', 'cpu_count', 'memory_info', 'disk_usage', 'load_average', 'reboot', 'shutdown', 'suspend'],
        'process': ['create', 'wait', 'is_running', 'kill', 'signal', 'list', 'info', 'read_stdout', 'read_stderr', 'write_stdin', 'priority', 'suspend', 'resume'],
        'validation': ['email', 'phone', 'url', 'ip', 'required', 'min_length', 'max_length', 'between', 'regex', 'is_numeric', 'is_integer', 'is_float', 'is_boolean', 'is_date', 'is_json', 'is_uuid'],
        'regex': ['match', 'search', 'replace', 'split', 'findall', 'compile', 'groups'],
        'crypto': ['hash', 'hmac', 'encrypt', 'decrypt', 'generate_key', 'sign', 'verify', 'random_bytes', 'pbkdf2', 'base64_encode', 'base64_decode', 'md5', 'sha1', 'sha256', 'sha512'],
        'uuid': ['generate', 'parse', 'validate', 'v1', 'v4'],
        'color': ['hex_to_rgb', 'rgb_to_hex', 'lighten', 'darken', 'blend', 'contrast', 'get_ansi_color', 'rgba_to_hex', 'hex_to_rgba'],
        'image': ['load', 'save', 'resize', 'crop', 'rotate', 'flip', 'blur', 'sharpen', 'grayscale', 'invert', 'draw_text', 'draw_shape', 'add_watermark'],
        'audio': ['load', 'play', 'pause', 'stop', 'record', 'save', 'volume', 'balance', 'duration', 'trim', 'fade_in', 'fade_out'],
        'video': ['load', 'play', 'pause', 'stop', 'record', 'save', 'trim', 'resize', 'add_subtitles', 'extract_audio', 'screenshot'],
        'compression': ['zip', 'unzip', 'gzip', 'gunzip', 'tar', 'untar', 'compress', 'decompress'],
        'archive': ['create', 'extract', 'list', 'add_file', 'remove_file'],
        'logging': ['info', 'warn', 'error', 'debug', 'fatal', 'trace', 'set_level', 'get_level', 'add_handler', 'remove_handler', 'format', 'rotate'],
        'config': ['load', 'save', 'get', 'set', 'remove', 'list', 'validate', 'merge', 'default'],
        'cache': ['set', 'get', 'has', 'remove', 'clear', 'keys', 'size', 'ttl'],
        'database': ['connect', 'disconnect', 'execute', 'query', 'fetch_one', 'fetch_all', 'commit', 'rollback', 'begin_transaction', 'migrate', 'seed', 'close', 'escape', 'prepare'],
        'http': ['start', 'stop', 'route', 'listen', 'serve_static', 'send_response', 'set_header', 'get_header', 'parse_request', 'parse_body', 'middleware', 'redirect', 'status'],
        'html': ['parse', 'stringify', 'escape', 'unescape', 'select', 'query', 'add_class', 'remove_class', 'set_attr', 'get_attr', 'inner_html', 'outer_html'],
        'template': ['render', 'compile', 'include', 'escape', 'loop', 'if', 'else', 'set', 'get', 'partial'],
        'csv': ['parse', 'stringify', 'read', 'write', 'validate', 'headers', 'rows', 'columns'],
        'xml': ['parse', 'stringify', 'validate', 'get_attr', 'set_attr', 'find', 'find_all'],
        'yaml': ['parse', 'stringify', 'validate', 'merge', 'flatten'],
        'ini': ['parse', 'stringify', 'get', 'set', 'remove', 'sections'],
        'notification': ['send', 'schedule', 'cancel', 'list', 'history'],
        'email': ['send', 'receive', 'parse', 'validate', 'attach', 'list', 'delete'],
        'sms': ['send', 'receive', 'parse', 'validate', 'history'],
        'websocket': ['connect', 'send', 'receive', 'close', 'broadcast', 'on_open', 'on_message', 'on_close'],
        'event': ['on', 'off', 'once', 'emit', 'listeners', 'remove_all'],
        'queue': ['enqueue', 'dequeue', 'peek', 'is_empty', 'size', 'clear', 'list'],
        'stack': ['push', 'pop', 'peek', 'is_empty', 'size', 'clear', 'list'],
        'graph': ['add_node', 'remove_node', 'add_edge', 'remove_edge', 'neighbors', 'bfs', 'dfs', 'shortest_path', 'has_cycle'],
        'tree': ['add_node', 'remove_node', 'find', 'traverse', 'depth', 'height', 'is_leaf'],
        'geometry': ['distance', 'midpoint', 'area', 'perimeter', 'volume', 'angle', 'rotate', 'scale', 'translate', 'intersect', 'union', 'difference'],
        'seed': ['generate', 'map_seed', 'noise_map', 'perlin', 'simplex', 'name', 'pattern'],
        'box': ['put', 'get', 'has', 'remove', 'clear', 'is_box', 'size'],
        'conversion': ['to_string', 'to_int', 'to_float', 'to_bool', 'to_array', 'to_object', 'to_json', 'to_yaml', 'to_csv', 'to_xml'],
        'headstails': ['coin', 'bool_tos', 'flip', 'probability'],
        'os': ['platform', 'architecture', 'distro', 'kernel', 'release', 'uptime', 'hostname', 'user', 'cpu_info', 'memory_info', 'disk_info'],
        'bolt': ['run', 'parallel', 'threads', 'task', 'await', 'schedule'],
        'animation': ['start', 'stop', 'pause', 'resume', 'set_frame', 'get_frame', 'timeline', 'easing', 'loop', 'reverse'],
        'physics': ['apply_force', 'apply_torque', 'velocity', 'acceleration', 'mass', 'collision', 'gravity', 'friction', 'momentum', 'energy'],
        'ai': ['predict', 'train', 'evaluate', 'load_model', 'save_model', 'preprocess', 'tokenize', 'embed', 'classify', 'cluster', 'generate_text']
    };

    const stdLibNames = Object.keys(razenStdLibs);
    const stdLibFunctions = [].concat(...Object.values(razenStdLibs));

    monaco.languages.register({
        id: 'razen',
        extensions: ['.rzn'],
        aliases: ['Razen', 'razen'],
    });

    monaco.languages.setLanguageConfiguration('razen', {
        comments: {
            lineComment: '#',
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
        keywords: [
            'var', 'const', 'if', 'else', 'while', 'for', 'is', 'when', 'not',
            'append', 'remove', 'key', 'value', 'store', 'box', 'ref', 'show',
            'read', 'fun', 'async', 'await', 'class', 'return', 'continue', 'break', 'import',
            'export', 'use', 'from', 'to', 'lib', 'true', 'false', 'null', 'struct', 'match', 'in'
        ],
        typeKeywords: [
            'num', 'str', 'bool', 'map', 'list', 'arr', 'obj', 'tuple', 'int', 'float'
        ],
        readTypeKeywords: [
            'num', 'str', 'int', 'float'
        ],
        colorKeywords: [
            'cyan', 'red', 'yellow', 'green', 'blue', 'magenta', 'white',
            'light_cyan', 'light_red', 'light_yellow', 'light_green', 'light_blue', 'light_magenta', 'light_white'
        ],
        operators: [
            '=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=',
            '&&', '||', '++', '--', '+', '-', '*', '/', '&', '|', '^', '%',
            '->', '=>'
        ],
        stdLibNames: stdLibNames,
        stdLibFunctions: stdLibFunctions,
        symbols: /[=><!~?:&|+\-*\/\^%]+/,
        escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

        tokenizer: {
            root: [
                [/#.*$/, 'comment'],
                [/[ \t\r\n]+/, ''],

                // f-string
                [/f"/, { token: 'keyword', next: '@f_string' }],

                // Namespace highlighting (e.g., math::sqrt)
                [/\b([a-zA-Z_]\w*)\b(?=::)/, {
                    cases: {
                        '@stdLibNames': 'entity.name.library',
                        '@default': 'identifier'
                    }
                }],
                [/::/, { token: 'metatag', next: '@library_function_call' }],

                [/\d*\.\d+([eE][-+]?\d+)?/, 'number.float'],
                [/0[xX][0-9a-fA-F]+/, 'number.hex'],
                [/\d+/, 'number'],

                [/"([^"\\]|\\.)*$/, 'string.invalid'],
                [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],
                [/'[^\\']'/, 'string.char'],
                [/(')(@escapes)(')/, ['string.char', 'string.escape', 'string.char']],
                [/'/, 'string.invalid'],

                // Type annotations
                [/[a-zA-Z_]\w*(?=\s*:)/, 'identifier', '@handle_type_annotation_colon'],

                // Function calls
                [/[a-zA-Z_]\w*(?=\s*\()/, {
                    cases: {
                        '@keywords': 'keyword',
                        '@stdLibFunctions': 'entity.name.function',
                        '@default': 'entity.name.function'
                    }
                }],

                // Keywords and identifiers
                [/[a-zA-Z_]\w*/, {
                    cases: {
                        'use': { token: 'keyword', next: '@use_statement' },
                        'show': { token: 'keyword', next: '@show_arguments' },
                        'fun': { token: 'keyword', next: '@function_declaration' },
                        'read': { token: 'keyword', next: '@read_statement' },
                        '@keywords': 'keyword',
                        '@default': 'identifier'
                    }
                }],

                [/[{}()\[\]]/, '@brackets'],
                
                [/@symbols/, {
                    cases: {
                        '@operators': 'operator',
                        '@default': 'delimiter'
                    }
                }],
                [/[;,.]/, 'delimiter'],
            ],
            string: [
                [/[^\\"]+/, 'string'],
                [/@escapes/, 'string.escape'],
                [/\\./, 'string.escape.invalid'],
                [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }]
            ],
            f_string: [
                [/{/, { token: 'delimiter.curly', next: '@f_string_expression' }],
                [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }],
                [/[^"{]+/, 'string']
            ],
            f_string_expression: [
                [/}/, { token: 'delimiter.curly', next: '@pop' }],
                { include: 'root' }
            ],
            handle_type_annotation_colon: [
                [/:/, { token: 'operator', next: '@type_annotation' }],
                ['', '', '@pop']
            ],
            type_annotation: [
                [/\s+/, ''],
                [/[a-zA-Z_]\w*/, {
                    cases: {
                        '@typeKeywords': 'type.identifier',
                        '@default': 'identifier'
                    }
                }],
                [/</, { token: 'delimiter.angle', bracket: '@open', next: '@generic_parameters' }],
                [/,/, 'delimiter'],
                ['', '', '@pop']
            ],
            generic_parameters: [
                [/>/, { token: 'delimiter.angle', bracket: '@close', next: '@pop' }],
                [/[a-zA-Z_]\w*/, {
                     cases: {
                        '@typeKeywords': 'type.identifier',
                        '@default': 'identifier'
                    }
                }],
                [/,/, 'delimiter'],
                [/</, { token: 'delimiter.angle', bracket: '@open', next: '@generic_parameters' }],
                [/\s+/, '']
            ],
            show_arguments: [
                [/\s*</, { token: 'delimiter.angle', bracket: '@open', next: '@show_annotation' }],
                { include: 'root', next: '@pop' }
            ],
            show_annotation: [
                [/\s+/, ''],
                [/[a-zA-Z_]\w*/, {
                    cases: {
                        '@colorKeywords': 'metatag',
                        '@default': 'identifier'
                    }
                }],
                [/>/, { token: 'delimiter.angle', bracket: '@close', next: '@pop' }],
                [/,/, 'delimiter'],
                ['', '', '@pop']
            ],
            read_statement: [
                [/\s*:/, { token: 'metatag', next: '@read_annotation' }],
                { include: 'root', next: '@pop' }
            ],
            read_annotation: [
                [/\s+/, ''],
                [/[a-zA-Z_]\w*/, {
                    cases: {
                        '@readTypeKeywords': 'type.identifier',
                        '@default': 'identifier'
                    },
                    next: '@pop'
                }],
                ['', '', '@pop']
            ],
            parameter_list: [
                [/\(/, {token: '@brackets', next: '@push'}],
                [/\)/, {token: '@brackets', next: '@pop'}],
                [/[a-zA-Z_]\w*(?=\s*:)/, 'identifier', '@handle_type_annotation_colon'],
                [/[a-zA-Z_]\w*/, 'identifier'],
                [/,/, 'delimiter'],
                [/\s+/, '']
            ],
            function_declaration: [
                [/[a-zA-Z_]\w*/, 'entity.name.function'],
                [/\(/, {token: '@brackets', next: '@parameter_list'}],
                [/:/, {token: 'operator', next: '@type_annotation'}],
                ['', '', '@pop']
            ],
            use_statement: [
                [/\s+/, ''],
                [/[a-zA-Z_]\w*/, {
                    cases: {
                        '@stdLibNames': { token: 'entity.name.library', next: '@pop' },
                        '@default': {token: 'identifier', next: '@pop'}
                    }
                }],
                [/"/, { token: 'string.quote', bracket: '@open', next: '@string_lib_pop' }],
                ['', '', '@pop']
            ],
            string_lib_pop: [
                [/[^\\"]+/, 'string'],
                [/@escapes/, 'string.escape'],
                [/\\./, 'string.escape.invalid'],
                [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }]
            ],
            library_function_call: [
                [/[a-zA-Z_]\w*/, {
                    cases: {
                        '@stdLibFunctions': { token: 'entity.name.function', next: '@pop' },
                        '@default': { token: 'identifier', next: '@pop' }
                    }
                }],
                ['', '', '@pop']
            ]
        }
    });

    monaco.editor.defineTheme('razen-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'comment', foreground: '608b4e' },
            { token: 'entity.name.library', foreground: '98C379' },
            { token: 'entity.name.function', foreground: 'FFF59D' },
            { token: 'metatag', foreground: '3CB371' },
            { token: 'type.identifier', foreground: '3CB371' },
            { token: 'string', foreground: 'CE9178' },
            { token: 'keyword', foreground: 'C586C0' },
            { token: 'operator', foreground: 'D4D4D4' },
            { token: 'number', foreground: 'B5CEA8' },
            { token: 'delimiter', foreground: 'D4D4D4' },
        ],
        colors: {
            'editor.background': '#1e1e2e',
            'editor.foreground': '#d4d4d4'
        }
    });

    monaco.editor.defineTheme('razen-light', {
        base: 'vs',
        inherit: true,
        rules: [
            { token: 'comment', foreground: '6a737d' },
            { token: 'entity.name.library', foreground: '2e8b57' },
            { token: 'entity.name.function', foreground: 'FFD54F' },
            { token: 'metatag', foreground: '2E8B57' },
            { token: 'type.identifier', foreground: '2E8B57' },
            { token: 'string', foreground: 'a31515' },
            { token: 'keyword', foreground: '0000ff' },
            { token: 'operator', foreground: '000000' },
            { token: 'number', foreground: '098658' },
            { token: 'delimiter', foreground: '000000' },
        ],
        colors: {
            'editor.background': '#ffffff',
            'editor.foreground': '#000000'
        }
    });
}
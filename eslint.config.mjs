import nx from "@nx/eslint-plugin";

export default [
    ...nx.configs["flat/base"],
    ...nx.configs["flat/typescript"],
    ...nx.configs["flat/javascript"],
    {
        ignores: [
            "**/dist",
            "**/out-tsc"
        ]
    },
    {
        files: [
            "**/*.ts",
            "**/*.tsx",
            "**/*.js",
            "**/*.jsx"
        ],
        rules: {
            "@nx/enforce-module-boundaries": [
                "error",
                {
                    enforceBuildableLibDependency: true,
                    allow: [
                        "^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$"
                    ],
                    depConstraints: [
                        // Clean Architecture layering: domain code may only depend on
                        // domain code; infrastructure may depend on domain+infrastructure;
                        // application entry points (apps) may depend on anything.
                        {
                            sourceTag: "type:domain",
                            onlyDependOnLibsWithTags: ["type:domain"]
                        },
                        {
                            sourceTag: "type:infrastructure",
                            onlyDependOnLibsWithTags: ["type:domain", "type:infrastructure"]
                        },
                        {
                            sourceTag: "type:app",
                            onlyDependOnLibsWithTags: ["type:domain", "type:infrastructure", "type:app"]
                        },
                        {
                            sourceTag: "type:e2e",
                            onlyDependOnLibsWithTags: ["type:domain", "type:infrastructure", "type:app", "type:e2e"]
                        },
                        // Bounded-context dependency direction between the foundation
                        // libraries themselves, to keep the graph a strict DAG:
                        //   kernel -> (nothing)
                        //   core/* -> kernel, core/*
                        //   tenancy -> kernel, core/*, tenancy
                        //   database -> kernel, core/*, tenancy, database
                        //   cqrs -> kernel, core/*, tenancy, database, cqrs
                        //   api -> anything
                        {
                            sourceTag: "scope:kernel",
                            onlyDependOnLibsWithTags: ["scope:kernel"]
                        },
                        {
                            sourceTag: "scope:core",
                            onlyDependOnLibsWithTags: ["scope:kernel", "scope:core"]
                        },
                        {
                            sourceTag: "scope:tenancy",
                            onlyDependOnLibsWithTags: ["scope:kernel", "scope:core", "scope:tenancy"]
                        },
                        {
                            sourceTag: "scope:database",
                            onlyDependOnLibsWithTags: ["scope:kernel", "scope:core", "scope:tenancy", "scope:database"]
                        },
                        {
                            sourceTag: "scope:cqrs",
                            onlyDependOnLibsWithTags: ["scope:kernel", "scope:core", "scope:tenancy", "scope:database", "scope:cqrs"]
                        },
                        {
                            sourceTag: "scope:api",
                            onlyDependOnLibsWithTags: ["*"]
                        }
                    ]
                }
            ]
        }
    },
    {
        files: [
            "**/*.ts",
            "**/*.tsx",
            "**/*.cts",
            "**/*.mts",
            "**/*.js",
            "**/*.jsx",
            "**/*.cjs",
            "**/*.mjs"
        ],
        // Override or add rules here
        rules: {}
    },
    {
        // The kernel is the pure DDD + CQRS contract layer for the whole platform:
        // it must stay importable from any future language/runtime port and must
        // never leak a framework or persistence dependency into Application-layer
        // code that depends on it. The Nx boundary rule above only governs imports
        // *between* Nx libraries, so it cannot stop a raw npm-package import; this
        // rule is the actual enforcement mechanism for "zero framework deps".
        files: ["libs/kernel/**/*.ts"],
        rules: {
            "no-restricted-imports": [
                "error",
                {
                    patterns: [
                        {
                            group: ["@nestjs/*", "typeorm", "express", "rxjs", "rxjs/*"],
                            message:
                                "libs/kernel must remain framework-agnostic (pure DDD + CQRS contracts). Framework and persistence dependencies belong in libs/core, libs/database, libs/cqrs, or apps/api."
                        }
                    ]
                }
            ]
        }
    }
];

import esbuild from "esbuild";
import path from "node:path";
import fs from "node:fs";

const SOURCE = path.resolve(import.meta.dirname, 'src');
const OUTPUT = path.resolve(import.meta.dirname, 'dist');

const BUILD_ENTRIES = [
    {   
        name: 'SVGIsolate.min.js',
        options: {
            entryPoints: [path.join(SOURCE, 'SVGIsolate.js')],
            minify: true,
            sourcemap: false,
            target: 'esnext',
            outfile: path.join(OUTPUT, 'SVGIsolate.min.js'),
        }
    },
    {
        name: 'SVGIsolate.min.css',
        options: {
            entryPoints: [path.join(SOURCE, 'SVGIsolate.css')],
            minify: true,
            outfile: path.join(OUTPUT, 'SVGIsolate.min.css'),
        }
    },
    {   
        name: 'index.js',
        options: {
            entryPoints: [path.join(SOURCE, 'index.js')],
            bundle: true,
            minify: true,
            sourcemap: false,
            target: 'esnext',
            outfile: path.join(OUTPUT, 'index.min.js'),
            plugins: [rawCSSPlugin()]
        }
    },
    {   
        name: 'define.js',
        options: {
            entryPoints: [path.join(SOURCE, 'define.js')],
            minify: true,
            sourcemap: false,
            target: 'esnext',
            outfile: path.join(OUTPUT, 'define.min.js'),
        }
    },
];

// Asegurarse de que dist exista
if (!fs.existsSync(OUTPUT)) fs.mkdirSync(OUTPUT);

for (const {name, options} of BUILD_ENTRIES) {
    
    try {
        await esbuild.build(options);

        console.log(`Build success: ${name}`);
    } 
    catch (error) {

        console.log(error);
    }
}



//MARK: Plugins
function rawCSSPlugin(){

    return {
        name: 'raw-css-loader',
        setup(build) {

            build.onResolve({ filter: /\.css\?raw$/  }, (args) => {

                return {
                    path: path.resolve(args.resolveDir, args.path.replace('?raw','')),
                    namespace: 'raw-file'
                };
            });

            build.onLoad({ filter: /.*/, namespace: 'raw-file' }, async (args) => {

                const content = await fs.promises.readFile(args.path, 'utf8');

                // Minify the CSS using esbuild transform API
                const { code } = await esbuild.transform(content, {
                    loader: "css",
                    minify: true
                });

                return {
                    contents: `export default ${JSON.stringify(code)};`,
                    loader: 'js'
                };
            });
        }
    };
}
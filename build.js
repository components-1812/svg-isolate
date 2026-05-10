import esbuild from "esbuild";
import path from "node:path";
import fs from "node:fs";

const SOURCE = path.resolve(import.meta.dirname, 'src');
const OUTPUT = path.resolve(import.meta.dirname, 'dist');


const sharedOptions = {
    target: 'esnext',
    sourcemap: false,
    format: 'esm',
    platform: 'browser',
};

const files = ['SVGIsolateBase', 'SVGIsolateCache', 'SVGIsolate'];

const BUILD_ENTRIES = [
   {
        name: 'SVGIsolate.js',
        options: {
            ...sharedOptions,
            entryPoints: [path.join(SOURCE, 'SVGIsolate.js')],
            bundle: true,         // absorbe Base y Cache
            minify: false,
            outfile: path.join(OUTPUT, 'SVGIsolate.js'),
            plugins: [rawCSSPlugin()]
        }
    },
    {
        name: 'SVGIsolate.min.js',
        options: {
            ...sharedOptions,
            entryPoints: [path.join(SOURCE, 'SVGIsolate.js')],
            bundle: true,
            minify: true,
            outfile: path.join(OUTPUT, 'SVGIsolate.min.js'),
            plugins: [rawCSSPlugin()]
        }
    },

    //MARK: CSS
    {
        name: 'SVGIsolate.css',
        options: { 
            entryPoints: [path.join(SOURCE, 'SVGIsolate.css')], 
            minify: false, 
            outfile: path.join(OUTPUT, 'SVGIsolate.css') 
        }
    },
    {
        name: 'SVGIsolate.min.css',
        options: { 
            entryPoints: [path.join(SOURCE, 'SVGIsolate.css')], 
            minify: true, 
            outfile: path.join(OUTPUT, 'SVGIsolate.min.css') 
        }
    },

    //MARK: bundle — todo incluido + CSS inline
    {
        name: 'index.bundle.js',
        options: { 
            ...sharedOptions, 
            entryPoints: [path.join(SOURCE, 'index.js')], 
            bundle: true, 
            minify: false, 
            outfile: path.join(OUTPUT, 'index.bundle.js'), 
            plugins: [rawCSSPlugin()] 
        }
    },
    {
        name: 'index.bundle.min.js',
        options: { 
            ...sharedOptions, 
            entryPoints: [path.join(SOURCE, 'index.js')], 
            bundle: true, 
            minify: true, 
            outfile: path.join(OUTPUT, 'index.bundle.min.js'), 
            plugins: [rawCSSPlugin()] 
        }
    },
]


// Asegurarse de que dist exista
if(!fs.existsSync(OUTPUT)) fs.mkdirSync(OUTPUT);

for(const {name, options} of BUILD_ENTRIES) {
    
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
                    contents: `export default ${JSON.stringify(code.trim())};`,
                    loader: 'js'
                };
            });
        }
    };
}
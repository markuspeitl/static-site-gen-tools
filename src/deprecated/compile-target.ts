//Instead of only compiling documents
//Generalize the interface in order to compile anything

/**
 * It should be possible to:
 * - Compile directories: Some compile runner completely takes over handling a directory
 * - Compile non text files: Does not need to read the contents of the file necessarily (at least not directly -> image resize, copyfiles, .etc)
 * - Compile a/any data src (compile remote resources)
 * 
 * With good generalization we can also define runners for tasks like asset management and copying
 */
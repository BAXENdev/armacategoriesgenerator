# Installation
Download the a3cg-0.0.1.vsix file
run ```code --install-extension /path/to/vsix```

# Usage
* Right click a folder with a bunch of functions and select generate categories.
* All functions in the selected folder is grouped under a Root class. All subfolders will have the path from the root folder name as the grouped class.
* A `categories.hpp` file is generated.
Now include the file in description.ext
```
class CfgFunctions {
  class TAG {
    #include "path\to\categories.hpp
  };
};
```

# Issues
* marked preinit and postinit functions do not always generate with the preinit/postinit attribute.

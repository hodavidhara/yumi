Yumi
===

Send commands to bamboo from Hipchat

## Current Commands ##

    help - Displays the list of Yumi commands.
    show plans - Lists all build plans.
    run build <plan key || branch key || alias> - Runs a build for the given plan, branch, or personal alias.
    show branches <plan key> - Lists all branches of the given plan.
    alias <plan key> <alias> - Creates a personal alias for a plan key.
    show aliases - Lists your personal aliases.
    show queue - Show the current build queue

## Getting Started ##

#### Requirements ####

- [node](http://nodejs.org/)
- [npm](https://npmjs.org/)
- [A CouchDB server](http://couchdb.apache.org/)

#### Installation ####

1. Clone the repo

        git clone git@github.com:hodavidhara/yumi.git
        
2. Change directories to your freshly created directory

        cd yumi
        
3. Install dependencies

        npm install
        
4. Fill in config.json

        vim ./config/config.json
        
5. Start Yumi

        node ./src/yumi.js

#### Configuration ####

- yumi
 - dbUrl - The url to your couchdb server.
- bamboo
 - domain - The domain where your bamboo installation lives.
 - username - The user with which yumi will perform actions in bamboo.
 - password - The password for the user.
 - project - The key to the specific project to view in your room.
- hipchat
 - apiKey - A hipchat api key. Can be [requested](https://www.hipchat.com/admin/api) by your hipchat admin. We suggest not sharing an API key with other applications.
 - room - The id of the room yumi will listen and post messages to.

# ibex-code-server-extensions-backup
Here contains all the files for the extensions I downloaded for use on code-server on the KAUST IBEX.

Code server extensions are really helpful for a variety of tasks and make writing programs less tedius and less error-prone. Here I've curated the most essential ones in my opinion so far for performing work on code-server. 

When initializing code-server on the IBEX from a new project folder, sometimes your extensions don't get saved to this new code-server instance. It would be very annoying to have to re-install every single extension you downloaded from a previous instance every single time you open up code-server so as a work-around I've created a backup folder with all the extension files so that you can just import them all with one command. 

This is how I recommend doing it.

### Copy the extension backups into your home folder

Your IBEX home directory stores is found at `/home/YOUR_KAUST_USERNAME`. No work is supposed to be done here, but it is a good place for storing configuration files. I would recommend cloning these extensions to your home directory and storing them there.

```bash
# Change into your home directory
cd /home/YOUR_KAUST_USERNAME # or just do cd ~

# Clone this repository into your home directory
git pull https://github.com/mpampuch/ibex-code-server-extensions-backup
# You may have to run module load git if you don't have git activated
```

### Import the extensions into your project

In order for code-server to read your extensions, they have to be in this folder `/ibex/user/YOUR_KAUST_USERNAME/YOUR_PROJECT_NAME/env/share/code-server/extensions/`
- In order to have the `env` folder, make sure you have created a conda environment using the instructions found here https://github.com/mpampuch/new-ibex-project-template

If this folder is empty or your extensions aren't loading in your code-server, run this command

```bash
# Make sure you are in your project folder before starting 
# Also make sure your extensions backup folder is in your home directory

# Copy all your extensions to your project folder
cp -rv ~/ibex-code-server-extensions-backup/* ./env/share/code-server/extensions/
```

Once this is done, launch or refresh your code-server instance and all your code-server extensions should be installed.
- Some extensions need a reload of the code-server instance, so to get all of them installed you might need to reload twice.

Now you're ready to work effectively.

### Creating a new backup

If you install any extensions whlie you're working in code-server, it's probably a good idea to back them up because there's a good chance they'll be useful to you in the future. To do this, simply do what was done previously in reverse. Copy all the files out of your code-server extensions folder and into your home directory.

```bash
# Make sure you are in your project folder before starting 
# Also make sure your extensions backup folder is in your home directory

# Copy all your extensions to your home folder
cp -rv ./env/share/code-server/extensions/* ~/ibex-code-server-extensions-backup/ 
```

Now all your backups should be up to date. From here you can pull them off the IBEX or push them to a GitHub repository if you want extra security.
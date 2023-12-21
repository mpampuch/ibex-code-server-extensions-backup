# ibex-code-server-extensions-backup
Here contains all the files for the extensions I downloaded for use on code-server on the KAUST IBEX.

Code server extensions are really helpful for a variety of tasks and make writing programs less tedius and less error-prone. Here I've curated the most essential ones in my opinion so far for performing work on code-server. 

When initializing code-server on the IBEX from a new project folder, sometimes your extensions don't get saved to this new code-server instance. It would be very annoying to have to re-install every single extension you downloaded from a previous instance every single time you open up code-server so as a work-around I've created a backup folder with all the extension files so that you can just import them all with one command. 

This is how I recommend doing it.

Your IBEX home directory stores is found at `/home/YOUR_KAUST_USERNAME`. No work is supposed to be done here, but it is a good place for storing configuration files. I would recommend cloning these extensions to your home directory and storing them there.

```bash
# Change into your home directory
cd /home/YOUR_KAUST_USERNAME # or just do cd ~

# Clone this repository into your home directory
git pull https://github.com/mpampuch/ibex-code-server-extensions-backup
# You may have to run module load git if you don't have git activated
```

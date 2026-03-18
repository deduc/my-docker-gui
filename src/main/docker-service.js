const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const util = require('util');

const execAsync = util.promisify(require('child_process').exec);

class DockerService {
    constructor() {
        this.isWindows = process.platform === 'win32';
        this.dockerCommand = this.isWindows ? 'docker' : 'docker';
    }

    async executeCommand(command) {
        console.log(`[Docker Service] Executing: ${command}`);
        
        try {
            const { stdout, stderr } = await execAsync(command);
            
            console.log(`[Docker Service] Command output:`);
            console.log(stdout);
            
            if (stderr) {
                console.log(`[Docker Service] Warning/Stderr:`);
                console.log(stderr);
            }
            
            console.log(`[Docker Service] Success: Command executed successfully`);
            return {
                stdout: stdout.trim(),
                stderr: stderr.trim(),
                command: command
            };
        } catch (error) {
            console.error(`[Docker Service] Error executing command: ${command}`);
            console.error(`[Docker Service] Error details:`, error);
            throw new Error(`Docker command failed: ${error.message}`);
        }
    }

    async getContainers() {
        const command = `${this.dockerCommand} ps -a`;
        const result = await this.executeCommand(command);
        
        console.log(`[Docker Service] Raw containers output:`, result.stdout);
        
        const lines = result.stdout.split('\n');
        const containers = [];
        
        // Skip header and process each line
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const container = this.parseContainerLine(line);
            if (container) {
                containers.push(container);
            }
        }
        
        // Sort containers: running first, then by name
        containers.sort((a, b) => {
            const aRunning = a.status.includes('Up');
            const bRunning = b.status.includes('Up');
            
            if (aRunning && !bRunning) return -1;
            if (!aRunning && bRunning) return 1;
            
            return a.names.localeCompare(b.names);
        });
        
        console.log(`[Docker Service] Final containers array:`, containers);
        return containers;
    }

    parseContainerLine(line) {
        const parts = line.split(/\s{2,}/);
        if (parts.length < 2) return null;

        const container = {
            id: parts[0] || '',
            image: parts[1] || '',
            status: '',
            ports: '',
            names: ''
        };

        // Find status, ports, and names in remaining parts
        let statusFound = false;
        for (let j = 2; j < parts.length; j++) {
            const part = parts[j];
            
            // Check if this part looks like a status
            if (!statusFound && (part.includes('Up') || part.includes('Exited') || 
                part.includes('Created') || part.includes('Restarting') || 
                part.includes('Removing') || part.includes('Dead') || 
                part.includes('Paused'))) {
                container.status = part;
                statusFound = true;
            }
            // Check if this part looks like ports (contains : or ->)
            else if (part.includes(':') || part.includes('->')) {
                container.ports = part;
            }
            // Last part is always the name (doesn't contain ports)
            else if (j === parts.length - 1) {
                container.names = part;
            }
        }

        // If no status found, try to infer from position
        if (!statusFound && parts.length > 2) {
            const possibleStatus = parts[2];
            if (possibleStatus && !possibleStatus.includes(':') && !possibleStatus.includes('->')) {
                container.status = possibleStatus;
            }
        }

        return container;
    }

    async getImages() {
        const command = `${this.dockerCommand} images`;
        const result = await this.executeCommand(command);
        
        console.log(`[Docker Service] Raw images output:`, result.stdout);
        
        const lines = result.stdout.split('\n');
        const images = [];
        
        // Skip header and process each line
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const image = this.parseImageLine(line);
            if (image) {
                images.push(image);
            }
        }
        
        console.log(`[Docker Service] Final images array:`, images);
        return images;
    }

    parseImageLine(line) {
        const parts = line.split(/\s{2,}/);
        if (parts.length < 4) return null;

        let repository = parts[0] || '';
        let tag = '';
        let id = '';
        
        // Handle case where repository already includes tag (e.g., "nginx:latest")
        if (repository.includes(':')) {
            const repoParts = repository.split(':');
            repository = repoParts[0];
            tag = repoParts[1];
            id = parts[1] || ''; // ID is the second part
        } else {
            // Repository doesn't include tag, so parts[1] is the ID
            id = parts[1] || '';
            tag = 'latest';
        }

        const diskUsage = parts[2] || '';
        const contentSize = parts[3] || '';

        return {
            repository: repository,
            tag: tag,
            id: id,
            diskUsage: diskUsage,
            contentSize: contentSize
        };
    }

    async getVolumes() {
        const command = `${this.dockerCommand} volume ls`;
        const result = await this.executeCommand(command);
        
        console.log(`[Docker Service] Raw volumes output:`, result.stdout);
        
        const lines = result.stdout.split('\n');
        const volumes = [];
        
        // Skip header and process each line
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const volume = this.parseVolumeLine(line);
            if (volume) {
                // Get volume details including mountpoint
                const volumeDetails = await this.getVolumeDetails(volume.name);
                volumes.push({
                    ...volume,
                    ...volumeDetails
                });
            }
        }
        
        console.log(`[Docker Service] Final volumes array:`, volumes);
        return volumes;
    }

    async getVolumeDetails(volumeName) {
        try {
            const command = `${this.dockerCommand} volume inspect ${volumeName}`;
            const result = await this.executeCommand(command);
            
            if (result.stdout) {
                const volumeData = JSON.parse(result.stdout);
                if (volumeData && volumeData.length > 0) {
                    const volume = volumeData[0];
                    return {
                        mountpoint: volume.Mountpoint || '',
                        created: volume.CreatedAt || '',
                        size: volume.UsageData ? volume.UsageData.Size : '',
                        scope: volume.Scope || ''
                    };
                }
            }
        } catch (error) {
            console.log(`[Docker Service] Could not get details for volume ${volumeName}:`, error.message);
        }
        
        return {
            mountpoint: '',
            created: '',
            size: '',
            scope: ''
        };
    }

    parseVolumeLine(line) {
        const parts = line.split(/\s{2,}/);
        if (parts.length < 2) return null;

        return {
            name: parts[0] || '',
            driver: parts[1] || ''
        };
    }

    async removeVolume(volumeName) {
        const command = `${this.dockerCommand} volume rm ${volumeName}`;
        return await this.executeCommand(command);
    }

    async runContainer(options) {
        const {
            image,
            name,
            ports,
            volumes,
            environment,
            detached = true,
            remove = false
        } = options;

        let command = `${this.dockerCommand} run`;
        
        if (detached) command += ' -d';
        if (remove) command += ' --rm';
        if (name) command += ` --name ${name}`;
        
        if (ports) {
            ports.forEach(port => {
                command += ` -p ${port}`;
            });
        }
        
        if (volumes) {
            volumes.forEach(volume => {
                command += ` -v ${volume}`;
            });
        }
        
        if (environment) {
            Object.entries(environment).forEach(([key, value]) => {
                command += ` -e ${key}="${value}"`;
            });
        }
        
        command += ` ${image}`;
        
        return await this.executeCommand(command);
    }

    async startContainer(containerId) {
        const command = `${this.dockerCommand} start ${containerId}`;
        return await this.executeCommand(command);
    }

    async stopContainer(containerId) {
        const command = `${this.dockerCommand} stop ${containerId}`;
        return await this.executeCommand(command);
    }

    async pauseContainer(containerId) {
        const command = `${this.dockerCommand} pause ${containerId}`;
        return await this.executeCommand(command);
    }

    async unpauseContainer(containerId) {
        const command = `${this.dockerCommand} unpause ${containerId}`;
        return await this.executeCommand(command);
    }

    async removeContainer(containerId) {
        const command = `${this.dockerCommand} rm ${containerId}`;
        return await this.executeCommand(command);
    }

    async generateDockerCompose(config) {
        const compose = {
            version: '3.8',
            services: {}
        };

        config.services.forEach(service => {
            compose.services[service.name] = {
                image: service.image,
                container_name: service.name
            };

            if (service.ports) {
                compose.services[service.name].ports = service.ports;
            }

            if (service.volumes) {
                compose.services[service.name].volumes = service.volumes;
            }

            if (service.environment) {
                compose.services[service.name].environment = service.environment;
            }

            if (service.depends_on) {
                compose.services[service.name].depends_on = service.depends_on;
            }
        });

        return JSON.stringify(compose, null, 2);
    }

    async saveCommandHistory(entry) {
        try {
            // Get user data directory
            const userDataPath = path.join(os.homedir(), '.my-docker-gui');
            
            // Ensure directory exists
            await fs.mkdir(userDataPath, { recursive: true });
            
            // Create history file path
            const historyFilePath = path.join(userDataPath, 'command-history.json');
            
            // Read existing history
            let history = [];
            try {
                const existingData = await fs.readFile(historyFilePath, 'utf8');
                history = JSON.parse(existingData);
            } catch (error) {
                // File doesn't exist or is empty, start with empty array
                history = [];
            }
            
            // Add new entry
            history.unshift(entry);
            
            // Keep only last 50 entries
            if (history.length > 50) {
                history.splice(50);
            }
            
            // Save to file
            await fs.writeFile(historyFilePath, JSON.stringify(history, null, 2), 'utf8');
            
            console.log(`[Docker Service] Command history saved to: ${historyFilePath}`);
            return historyFilePath;
        } catch (error) {
            console.error('[Docker Service] Error saving command history:', error);
            throw error;
        }
    }

    async getCommandHistory() {
        try {
            // Get user data directory
            const userDataPath = path.join(os.homedir(), '.my-docker-gui');
            const historyFilePath = path.join(userDataPath, 'command-history.json');
            
            // Read existing history
            try {
                const existingData = await fs.readFile(historyFilePath, 'utf8');
                const history = JSON.parse(existingData);
                console.log(`[Docker Service] Command history loaded from: ${historyFilePath}`);
                return history;
            } catch (error) {
                // File doesn't exist or is empty, return empty array
                console.log('[Docker Service] No existing command history found');
                return [];
            }
        } catch (error) {
            console.error('[Docker Service] Error getting command history:', error);
            throw error;
        }
    }
}

module.exports = DockerService;

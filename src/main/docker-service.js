const { spawn } = require('child_process');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

class DockerService {
    constructor() {
        this.isWindows = process.platform === 'win32';
        this.dockerCommand = this.isWindows ? 'docker' : 'docker';
    }

    async executeCommand(command) {
        console.log(`[Docker Service] Executing: ${command}`);
        
        try {
            const { stdout, stderr } = await exec(command);
            
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
            
            console.log(`[Docker Service] Processing container line: "${line}"`);
            
            // Parse docker ps output format - handle variable spacing
            const parts = line.split(/\s{2,}/); // Split by 2+ spaces
            console.log(`[Docker Service] Container parts:`, parts);
            
            if (parts.length >= 2) { // At least ID and image
                // Handle cases where ports/names might be merged
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
                    // Usually status is in position 2 or 3
                    const possibleStatus = parts[2];
                    if (possibleStatus && !possibleStatus.includes(':') && !possibleStatus.includes('->')) {
                        container.status = possibleStatus;
                    }
                }
                
                console.log(`[Docker Service] Parsed container:`, container);
                containers.push(container);
            }
        }
        
        // Sort containers: running first, then by name
        containers.sort((a, b) => {
            const aRunning = a.status.includes('Up');
            const bRunning = b.status.includes('Up');
            
            if (aRunning && !bRunning) return -1;
            if (!aRunning && bRunning) return 1;
            
            // Both have same running status, sort by name
            return a.names.localeCompare(b.names);
        });
        
        console.log(`[Docker Service] Final containers array:`, containers);
        return containers;
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
            
            console.log(`[Docker Service] Processing image line: "${line}"`);
            
            // Parse docker images output format
            const parts = line.split(/\s{2,}/); // Split by 2+ spaces
            console.log(`[Docker Service] Image parts:`, parts);
            
            if (parts.length >= 3) {
                let repository = parts[0] || '';
                let tag = parts[1] || '';
                let id = parts[2] || '';
                
                // Handle case where repository already includes tag (e.g., "nginx:latest")
                if (repository.includes(':')) {
                    const repoParts = repository.split(':');
                    repository = repoParts[0];
                    tag = repoParts[1];
                }
                
                // Ensure ID doesn't look like a tag
                if (id.includes(':') || /^[a-f0-9]{12,}$/i.test(id)) {
                    // id looks correct
                } else if (tag && !tag.includes(':') && !/^[a-f0-9]{12,}$/i.test(tag)) {
                    // tag might actually be the ID, swap them
                    id = tag;
                    tag = 'latest';
                }
                
                images.push({
                    repository: repository,
                    tag: tag || 'latest',
                    id: id,
                    createdAt: parts[3] || '',
                    size: parts[4] || ''
                });
                
                console.log(`[Docker Service] Parsed image:`, images[images.length - 1]);
            }
        }
        
        console.log(`[Docker Service] Final images array:`, images);
        return images;
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
            
            console.log(`[Docker Service] Processing volume line: "${line}"`);
            
            // Parse docker volume ls output format
            const parts = line.split(/\s{2,}/); // Split by 2+ spaces
            console.log(`[Docker Service] Volume parts:`, parts);
            
            if (parts.length >= 2) { // At least name and driver
                volumes.push({
                    name: parts[0] || '',
                    driver: parts[1] || ''
                });
                
                console.log(`[Docker Service] Parsed volume:`, volumes[volumes.length - 1]);
            }
        }
        
        console.log(`[Docker Service] Final volumes array:`, volumes);
        return volumes;
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
}

module.exports = new DockerService();

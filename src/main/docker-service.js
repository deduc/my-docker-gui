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
        const command = `${this.dockerCommand} ps`;
        const result = await this.executeCommand(command);
        
        const lines = result.stdout.split('\n');
        const containers = [];
        
        // Skip header and process each line
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            // Parse docker ps output format
            const parts = line.split(/\s{2,}/); // Split by 2+ spaces
            if (parts.length >= 4) {
                containers.push({
                    id: parts[0] || '',
                    image: parts[1] || '',
                    status: parts[2] || '',
                    ports: parts[3] || '',
                    names: parts.slice(-1)[0] || '' // Last part is always the name
                });
            }
        }
        
        return containers;
    }

    async getImages() {
        const command = `${this.dockerCommand} images`;
        const result = await this.executeCommand(command);
        
        const lines = result.stdout.split('\n');
        const images = [];
        
        // Skip header and process each line
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            // Parse docker images output format
            const parts = line.split(/\s{2,}/); // Split by 2+ spaces
            if (parts.length >= 5) {
                images.push({
                    repository: parts[0] || '',
                    tag: parts[1] || '',
                    id: parts[2] || '',
                    createdAt: parts[3] || '',
                    size: parts[4] || ''
                });
            }
        }
        
        return images;
    }

    async getVolumes() {
        const command = `${this.dockerCommand} volume ls`;
        const result = await this.executeCommand(command);
        
        const lines = result.stdout.split('\n');
        const volumes = [];
        
        // Skip header and process each line
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            // Parse docker volume ls output format
            const parts = line.split(/\s{2,}/); // Split by 2+ spaces
            if (parts.length >= 2) {
                volumes.push({
                    name: parts[0] || '',
                    driver: parts[1] || ''
                });
            }
        }
        
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

    async stopContainer(containerId) {
        const command = `${this.dockerCommand} stop ${containerId}`;
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

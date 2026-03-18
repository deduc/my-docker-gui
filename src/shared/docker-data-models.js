/**
 * Modelos de datos unificados para recursos Docker
 */

class DockerImageData {
    constructor(repository, tag, id, diskUsage, contentSize) {
        this.repository = repository;
        this.tag = tag;
        this.id = id;
        this.diskUsage = diskUsage;
        this.contentSize = contentSize;
        this.fullName = `${repository}:${tag}`;
    }

    getShortId(length = 12) {
        return this.id ? this.id.substring(0, length) : 'N/A';
    }

    getDisplayInfo() {
        return `ID: ${this.getShortId()} | ${this.diskUsage} | ${this.contentSize}`;
    }

    static fromDockerOutput(line) {
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

        return new DockerImageData(repository, tag, id, diskUsage, contentSize);
    }
}

class DockerContainerData {
    constructor(id, image, status, ports, names) {
        this.id = id;
        this.image = image;
        this.status = status;
        this.ports = ports;
        this.names = names;
    }

    isRunning() {
        return this.status.includes('Up');
    }

    isStopped() {
        return !this.isRunning();
    }

    getStatusInfo() {
        const portInfo = this.ports || 'Sin puertos';
        return `${this.image} | ${portInfo} | ${this.status || 'Desconocido'}`;
    }

    static fromDockerOutput(line) {
        const parts = line.split(/\s{2,}/);
        if (parts.length < 2) return null;

        const container = new DockerContainerData(
            parts[0] || '',
            parts[1] || '',
            '',
            '',
            ''
        );

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
}

class DockerVolumeData {
    constructor(name, driver) {
        this.name = name;
        this.driver = driver;
    }

    getDisplayInfo() {
        return `Driver: ${this.driver}`;
    }

    static fromDockerOutput(line) {
        const parts = line.split(/\s{2,}/);
        if (parts.length < 2) return null;

        return new DockerVolumeData(
            parts[0] || '',
            parts[1] || ''
        );
    }
}

module.exports = {
    DockerImageData,
    DockerContainerData,
    DockerVolumeData
};

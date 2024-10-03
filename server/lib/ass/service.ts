import { readFileSync } from 'fs';
import { logger } from '../logger';

export function getServiceName() {
  try {
      // Read the cgroup file
      const cgroupContent = readFileSync('/proc/self/cgroup', 'utf8');
      const lines = cgroupContent.split('\n');

      // Look for possible systemd entries in different hierarchies
      for (let line of lines) {
          if (line.includes('systemd')) {
              const parts = line.split('/');
              const serviceName = parts.pop();
              if (serviceName) {
                  return serviceName.replace('.service', '');
              }
          }
      }

      // Additional fallback: check all lines for any service name ending in ".service"
      for (let line of lines) {
          const match = line.match(/\.service$/);
          if (match) {
              const parts = line.split('/');
              return parts.pop()?.replace('.service', '') || null;
          }
      }
  } catch (error) {
      logger.error('Could not determine service name:', error);
  }

  return null;
}
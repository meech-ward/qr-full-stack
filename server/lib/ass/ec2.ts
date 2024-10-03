const METADATA_BASE_URL = 'http://169.254.169.254/latest/meta-data';
const TOKEN_URL = 'http://169.254.169.254/latest/api/token';

async function getMetadataToken(): Promise<string> {
  const response = await fetch(TOKEN_URL, {
    method: 'PUT',
    headers: {
      'X-aws-ec2-metadata-token-ttl-seconds': '21600'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to get metadata token: ${response.statusText}`);
  }

  return await response.text();
}

async function fetchMetadata(path: string): Promise<string> {
  const token = await getMetadataToken();
  const response = await fetch(`${METADATA_BASE_URL}/${path}`, {
    headers: {
      'X-aws-ec2-metadata-token': token
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch metadata for ${path}: ${response.statusText}`);
  }

  return await response.text();
}

export async function getInstanceId(): Promise<string> {
  return await fetchMetadata('instance-id');
}

export async function getInstanceType(): Promise<string> {
  return await fetchMetadata('instance-type');
}

export async function getPrivateIpv4(): Promise<string> {
  return await fetchMetadata('local-ipv4');
}

export async function getPublicIpv4(): Promise<string> {
  return await fetchMetadata('public-ipv4');
}

export async function getRegion(): Promise<string> {
  return await fetchMetadata('placement/region');
}

export async function getAvailabilityZone(): Promise<string> {
  return await fetchMetadata('placement/availability-zone');
}

export async function getSecurityGroups(): Promise<string[]> {
  const data = await fetchMetadata('security-groups');
  return data.split('\n').filter(Boolean);
}

export async function getIamRole(): Promise<string> {
  return await fetchMetadata('iam/security-credentials');
}

// Generic function to fetch any metadata
export async function getGenericMetadata(path: string): Promise<string> {
  return await fetchMetadata(path);
}

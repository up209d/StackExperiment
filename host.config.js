import myIP from 'quick-local-ip';

export default {
  hostLanIP: myIP.getLocalIP4(),
  hostName: 'localhost',
  hostPublicIP: '0.0.0.0',
  hostPort: 20987
}

/**
 * Extension.ts
 * 
 * @author    Desionlab <fenixphp@gmail.com>
 * @copyright 2014 - 2018 Desionlab
 * @license   MIT
 */

import Vorpal from 'vorpal';
import SocketIO from 'socket.io';
const SocketIOEmitter = require('socket.io-emitter');
import SocketIORedisAdapter from 'socket.io-redis';
import { Cluster, Di, Extensions } from '@fastpanel/core';
import { SetupTaskDefinesMethod } from '@fastpanel/core/build/Commands';

/**
 * Class Extension
 * 
 * Initialization of the extension.
 * 
 * @version 1.0.0
 */
export class Extension extends Extensions.ExtensionDefines {

  /**
   * Registers a service provider.
   */
  async register () : Promise<any> {
    if (this.context instanceof Cluster.Handler) {
      /* Registration websocket server. */
      this.di.set('socket', (container: Di.Container) => {
        /* Create server. */
        let socket = SocketIO(this.http, {
          path: '/real-time'
        });

        /* Set io adapter. */
        socket.adapter(SocketIORedisAdapter({
          pubClient: container.get('redis', this.config.get('Extensions/SocketIO.redis', null)),
          subClient: container.get('redis', this.config.get('Extensions/SocketIO.redis', null))
        }));

        return socket;
      }, true);
    } else {
      /* Registration websocket emitter. */
      this.di.set('socket', (container: Di.Container) => {
        let socket = SocketIOEmitter(
          container.get('redis', this.config.get('Extensions/SocketIO.redis', null))
        );
        return socket;
      }, true);
    }
    
    /* Install and configure the basic components of the system. */
    this.events.on('app:getSetupTasks', async (list: Array<SetupTaskDefinesMethod>) => {
      list.push(async (command: Vorpal.CommandInstance, argv?: any) => {});
    });

    /* Registered cli commands. */
    this.events.once('cli:getCommands', async (cli: Vorpal) => {});
  }
  
  /**
   * Startup a service provider.
   */
  async startup () : Promise<any> {
    /* Check context. */
    if (this.context instanceof Cluster.Handler) {
      /* Fire event. */
      this.events.emit('socket:getMiddleware', this.socket);
      this.events.emit('socket:getActions', this.socket);
    }
    
    /* Fire event. */
    this.events.emit('socket:startup', this.socket);
  }

}

/* End of file Extension.ts */
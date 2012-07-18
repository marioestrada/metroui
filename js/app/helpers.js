(function(Spine, $)
{

	Spine.Controller.include({  
		isActive: function()
		{
			return this.active;
		},
		  
		activate: function()
		{
			this.active = true;
			this.el.removeClass('hidden');
		},
	  
		deactivate: function()
		{
			this.active = false;
			this.el.addClass('hidden');
		}
	});

	Spine.ControllerWithManager = Spine.Controller.create({
		managed_controllers: [],
		
		active_controller: null,
		
		manage: function()
		{
			arguments = Array.prototype.slice.call(arguments, 0);	
			this.managed_controllers = arguments;
		},
		
		activateController: function(controller)
		{
			controller = controller ? controller : null;
			
			if(controller != null)
			{
				if(this.managed_controllers.indexOf(controller) < 0)
					throw "There's no controller `" + controller + "` being managed.";
				
				if(this[controller].isActive())
					return;
			}
			
			var self = this;
			_.each(this.managed_controllers, function(c)
			{
				if(c == controller)
					self[c].activate();
				else
					self[c].deactivate();
			});
			
			this.active_controller = controller;
		},
		
		deactivateAll: function()
		{
			this.activateController(null);
		}
	});
	
})(Spine, Spine.$);
/**
 * @file
 * The active project is just an instance of the class `Project` that contains everything we need to display and interact with the automata being created.
 *
 * There is a store `project` that allows for direct access to this `Project` class, but if everything used it,
 * then any minor update to the project would require a full update to the entire UI.
 * Therefore we have a scoped store for each project member, which will not update when other scoped stores update. We also have some custom stores.
 *
 * The store scope looks like:
 *
 * project
 *  - name
 *  - components
 *     - activeView
 *  - systems
 *     - activeView
 *  - queries
 *  - systemDeclarations
 *  - globalDeclarations
 *
 * An update to a store will trigger updates in all parent stores and child stores, but will not trigger updates in any sibling stores.
 *
 */

import type { Writable, Subscriber, Unsubscriber, Updater } from "svelte/store";
import type { Project } from "$lib/classes/automaton/Project";
import type { Component, System } from "$lib/classes/automaton";

type ProjectKeys = Pick<
	Project,
	| "id"
	| "locationIds"
	| "edgeIds"
	| "components"
	| "systems"
	| "queries"
	| "systemDeclarations"
	| "globalDeclarations"
>;

let projectValue: Project | undefined;

const projectSubscribers = new Set<Subscriber<Project | undefined>>();
const memberSubscribers: {
	[key in keyof ProjectKeys]: Set<Subscriber<Project[key] | undefined>>;
} = {
	id: new Set(),
	locationIds: new Set(),
	edgeIds: new Set(),
	components: new Set(),
	systems: new Set(),
	queries: new Set(),
	systemDeclarations: new Set(),
	globalDeclarations: new Set(),
};

/**
 * This store subscribes to all changes on the Project, and allows you to edit all members of the Project.
 * You probably don't want this, as you will be subscribing to tonnes of changes that do not affect what you are listening to,
 * and if you change the value of the store, you will be updating all scoped stores.
 * Consider using one of the scoped stores instead.
 */
export const project: Writable<Project | undefined> = {
	set(value) {
		projectValue = value;
		for (const subscriber of projectSubscribers) {
			subscriber(projectValue);
		}
		// TODO: This "as" conversion is killing some type safety. Is there a better way to represent this operation?
		for (const [key, subscribers] of Object.entries(memberSubscribers) as [
			keyof Project,
			Set<Subscriber<Project[keyof Project] | undefined>>,
		][]) {
			for (const subscriber of subscribers) {
				subscriber(projectValue?.[key]);
			}
		}
	},
	update(updater) {
		project.set(updater(projectValue));
	},
	subscribe(subscriber) {
		projectSubscribers.add(subscriber);
		subscriber(projectValue);

		const unsubscribe: Unsubscriber = () => {
			projectSubscribers.delete(subscriber);
		};
		return unsubscribe;
	},
};

/**
 * This store only subscribes to changes made to a specific member on the Project,
 * and if you update it, it will not trigger updates in any other scoped store.
 */
class ProjectMemberStore<T extends keyof ProjectKeys>
	implements Writable<Project[T] | undefined>
{
	constructor(private key: T) {}
	private get storeMember() {
		return projectValue?.[this.key];
	}
	private get subscribers() {
		return memberSubscribers[this.key];
	}
	set(value: Project[T] | undefined) {
		if (projectValue === undefined && value !== undefined) {
			throw new TypeError(
				"Cannot set a member of the project when no project is open",
			);
		}
		if (projectValue !== undefined && value === undefined) {
			throw new TypeError("Cannot remove a member on an open project");
		}
		for (const subscriber of memberSubscribers[this.key]) {
			subscriber(this.storeMember);
		}
		for (const subscriber of projectSubscribers) {
			subscriber(projectValue);
		}
	}
	update(updater: Updater<Project[T] | undefined>) {
		this.set(updater(this.storeMember));
	}
	subscribe(subscriber: Subscriber<Project[T] | undefined>) {
		this.subscribers.add(subscriber);
		subscriber(this.storeMember);

		const unsubscribe: Unsubscriber = () => {
			this.subscribers.delete(subscriber);
		};
		return unsubscribe;
	}
}

/**
 * This store subscribes to changes / can make changes on the `name` member of the active `Project`.
 */
export const name = new ProjectMemberStore("id");

/**
 * This store subscribes to changes / can make changes on the `locationIds` member of the active `Project`.
 */
export const locationIds = new ProjectMemberStore("locationIds");

/**
 * This store subscribes to changes / can make changes on the `edgeIds` member of the active `Project`.
 */
export const edgeIds = new ProjectMemberStore("edgeIds");

/**
 * This store subscribes to changes / can make changes on the `components` member of the active `Project`.
 */
export const components = new ProjectMemberStore("components");

/**
 * This store subscribes to changes / can make changes on the `systems` member of the active `Project`.
 */
export const systems = new ProjectMemberStore("systems");

/**
 * This store subscribes to changes / can make changes on the `queries` member of the active `Project`.
 */
export const queries = new ProjectMemberStore("queries");

/**
 * This store subscribes to changes / can make changes on the `systemDeclarations` member of the active `Project`.
 */
export const systemDeclarations = new ProjectMemberStore("systemDeclarations");

/**
 * This store subscribes to changes / can make changes on the `globalDeclarations` member of the active `Project`.
 */
export const globalDeclarations = new ProjectMemberStore("globalDeclarations");

export type ActiveView = Component | System | undefined;
let activeViewValue: ActiveView;
const activeViewSubscribers = new Set<Subscriber<ActiveView>>();

class ActiveViewStore implements Writable<ActiveView> {
	set(value: ActiveView) {
		if (value !== undefined) {
			if (!projectValue) {
				throw new TypeError(
					"Cannot set an active view when no project is open",
				);
			} else if (
				![...projectValue.components, ...projectValue.systems].includes(
					value,
				)
			) {
				throw new TypeError(
					"Cannot set an active view that is not part of the active project",
				);
			}
		}
		activeViewValue = value;
		for (const subscriber of activeViewSubscribers) {
			subscriber(activeViewValue);
		}
		for (const subscriber of memberSubscribers.components) {
			subscriber(projectValue?.components);
		}
		for (const subscriber of memberSubscribers.systems) {
			subscriber(projectValue?.systems);
		}
		for (const subscriber of projectSubscribers) {
			subscriber(projectValue);
		}
	}
	/**
	 * This is intended to be used when doing fast (every 10ms) UI updates where performance is very important.
	 * It will signal to all subscribers of the `activeView` that there is an update,
	 * but it will not signal the update to other subscribers of the project.
	 *
	 * WARNING: After using this function, you should update the value normally to ensure that all subscribers are aware of the changes you've made.
	 *
	 */
	fastUpdate() {
		for (const subscriber of activeViewSubscribers) {
			subscriber(activeViewValue);
		}
	}
	update(updater: Updater<ActiveView>) {
		this.set(updater(activeViewValue));
	}
	subscribe(subscriber: Subscriber<ActiveView>) {
		activeViewSubscribers.add(subscriber);
		subscriber(activeViewValue);

		const unsubscribe: Unsubscriber = () => {
			activeViewSubscribers.delete(subscriber);
		};
		return unsubscribe;
	}
}
/**
 * This store defines which Component/System is displayed in the SVG view.
 */
export const activeView = new ActiveViewStore();

components.subscribe(closeActiveViewIfDeleted);
systems.subscribe(closeActiveViewIfDeleted);
function closeActiveViewIfDeleted() {
	if (activeViewValue === undefined) return;
	if (
		!projectValue ||
		![...projectValue.components, ...projectValue.systems].includes(
			activeViewValue,
		)
	) {
		activeView.set(undefined);
	}
}

<script lang="ts">
	export let componentText: string;
</script>

<div class="wrap">
	<p class="unselectable">></p>
	<p>{componentText}</p>
</div>

<style>
	p {
		margin: 0.2em 0em 0.2em 0.5em;
		text-shadow: 0 1.5px 1px rgba(28, 28, 28, 0.3);
		color: var(--console-text-color);
	}

	.wrap {
		display: flex;
		flex-wrap: wrap;
	}

	.wrap p:first-child {
		flex: 0 0 auto;
	}

	.wrap p:last-child {
		flex: 1;
		min-width: 0;
	}

	.unselectable {
		-webkit-user-select: none;
		-ms-user-select: none;
		user-select: none;
	}
</style>

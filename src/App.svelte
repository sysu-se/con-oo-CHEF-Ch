<script>
	import { onMount, onDestroy } from 'svelte';
	import { validateSencode } from '@sudoku/sencode';
	import game from '@sudoku/game';
	import { modal } from '@sudoku/stores/modal';
	import { gameWon } from '@sudoku/stores/game';
	import Board from './components/Board/index.svelte';
	import Controls from './components/Controls/index.svelte';
	import Header from './components/Header/index.svelte';
	import Modal from './components/Modal/index.svelte';

	const unsub = gameWon.subscribe((won) => {
		if (won) {
			game.pause();
			modal.show('gameover');
		}
	});

	onMount(() => {
		let hash = location.hash;
		if (hash.startsWith('#')) hash = hash.slice(1);

		let sencode;
		if (validateSencode(hash)) sencode = hash;

		modal.show('welcome', {
			onHide: () => {
				game.start({ sencode });
				game.resume();
			},
			sencode,
		});
	});

	onDestroy(() => {
		unsub();
	});
</script>

<header>
	<Header />
</header>

<section>
	<Board />
</section>

<footer>
	<Controls />
</footer>

<Modal />

<style global>
	@import './styles/global.css';
</style>
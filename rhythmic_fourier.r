library( sparsepca ) # for sparse PCA / SVD
library( pracma ) # for nullspace

number_of_harmonics = 128
harmonics = 1:number_of_harmonics

# compute all terms of the Fourier series up to L harmonics.
# sin terms come first, then cosine terms
# A weighting is included so that we can up-weight lower harmonics i.e. favour them in fitted coefficients
fterms = function(
	x,
	coeffs,
	weighting = 0.5^(0:(L-1))
) {
	L = length(coeffs)/2
	# ith harmonic is given amplitude 1/i, so has same gradient at 0
	c(
		(weighting * coeffs[1:L] * sin(x*(1:L)) / 1:L),
		(weighting * coeffs[L+(1:L)] * cos(x*(1:L)) / 1:L )
	)
}

dfterms = function(
	x,
	coeffs,
	weighting = 0.5^(0:(L-1))
) {
	L = length(coeffs)/2
	# ith harmonic is given amplitude 1/i, so has same gradient at 0
	c(
		(weighting * coeffs[1:L] * cos(x*(1:L)) ),
		(-weighting * coeffs[L+(1:L)] * sin(x*(1:L)) )
	)
}

f = function(x, coeffs, weighting = 0.5^(0:(L-1)) ) {
	sapply(
		x,
		function(x) {
			sum( fterms( x, coeffs, weighting ))
		}
	)
}

df = function(x, coeffs, weighting = 0.5^(0:(L-1)) ) {
	sapply(
		x,
		function(x) {
			sum( dfterms( x, coeffs, weighting ))
		}
	)
}

plot.it <- function( coeffs, crossing.points = NULL, weighting = weighting ) {
	xs = seq( from = 0, to = 2*pi, by = 0.01 )
	ylim = c(
		min(-1, min( f( xs, coeffs, weighting ) * 1.05 )),
		max(1, max( f( xs, coeffs, weighting ) * 1.05 ))
	)

	plot( xs, f( xs, coeffs, weighting ), type = 'l', lwd = 5, bty = 'n', ylim = ylim, xaxt = 'n', xlab = '' )
	axis( 1, at = seq( from = 0, to = 2*pi, by = pi/4 ), labels = c( '0', 'pi/4', 'pi/2', '3pi/4', 'pi', '5pi/4', '6pi/4', '7pi/4', '2pi'))
	mtext( 'x', side = 1, line = 3, cex = 2 )
	abline( h = seq( from = floor( min( ylim )), to = ceiling( max( ylim )), by = 0.5 ), lty = 1, col = rgb( 0, 0, 0, 0.2 ), lwd = 1 )
	abline( h = seq( from = floor( min( ylim )), to = ceiling( max( ylim )), by = 1 ), lty = 1, col = rgb( 0, 0, 0, 0.2 ), lwd = 2 )
	abline( v = 2*pi*(0:7)/8, lty = 1, col = rgb( 0, 0, 0, 0.2 ), lwd = 1 )
	abline( v = 2*pi*(0:3)/4, lty = 1, col = rgb( 0, 0, 0, 0.2 ), lwd = 2 )
	points( xs, df( xs, coeffs, weighting ), type = 'l', lwd = 1, lty = 2 )
	legend(
		"topright",
		legend = c( "f", "df" ),
		lty = c( 1, 2 ),
		lwd = c( 5, 2 ),
		bty = 'n'
	)
	if( !is.null( points )) {
		points(
			crossing.points[,1],
			crossing.points[,2],
			col = 'red'
		)
		points(
			crossing.points[,1],
			rep(0, nrow(crossing.points)),
			col = 'red'
		)
	}
}


fourier.expand = function( crossing.points, number_of_harmonics, weighting ) {
	# We will write constrians as Ax = b and we need to solve for x.
	A = matrix(
		NA,
		nrow = 2*nrow(crossing.points),
		ncol = 2*number_of_harmonics,
		byrow = T
	)
	L = number_of_harmonics
	for( i in 1:nrow( crossing.points )) {
		# Curve passes through zero so encode value of the harmonic comonents at the point
		A[2*i-1,] = fterms( crossing.points[i,1], rep( 1, L*2 ), weighting )
		A[2*i,] = dfterms( crossing.points[i,1], rep( 1, L*2 ), weighting )
	}

	S = svd(A)
	# Now A = U D V^t, i.e.
	stopifnot( max( A - (S$u %*% diag(S$d) %*% t(S$v)) ) < 1E-12 )

	# and
	# and pseudoinverse is
	# A^+ = V D^+ U^t

	# Solve for minimum 2-norm solution A x = b
	pseudoinverse = S$v %*% diag( 1/S$d ) %*% t(S$u )
	n = nrow(crossing.points)
	# Kludge as we need b in Ax=b to be interspersed 0 (crosses at zero) and gradients.
	select = c( 1, n+1, 2, n+2, 3, n+3, 4, n+4, 5, n+5, 6, n+6, 7, n+7, 8, n+8, 9, n+9, 10, n+10)
	b = c( rep( 0, n ), crossing.points[,2] )[ select[1:(n*2)]]
	z_0 = pseudoinverse %*% b
	return(z_0)
}

# Points in interval of length P = 2pi


twopi = 2*pi
point.sets = list(
	door = list(
		name = "There's somebody at the door",
		data = as.matrix(
			 tibble::tribble(
				~x,                 ~dx,
				# Some-
				0      * twopi / 4,   1,
				# bo-
				1/3 * twopi / 4, 0.4,
				# dy
				2/3 * twopi / 4, 0.5,
				# at
				1      * twopi / 4, 0.9,
				# the
				5/3 * twopi / 4, 0.8,
				# door.
				2      * twopi / 4,   1,
				# There's
				11/3 * twopi / 4, 0.3
			)
		)
	),
	mario = list(
		name = "1st bar of Mario",
		data = as.matrix(
			tibble::tibble(
				x = c(
		#			(2*pi)/16 * c(0,3,6,10,12)
		#			(2*pi)/16 * c(2,4,8,11,14)
		#			(2*pi)/16 * c( 2, 5, 8, 11, 14 )
		#			(2*pi)/16 * c( 0, 3, 6, 10, 13 )
					((2*pi)/16) * c( 0, 3, 6, 9, 11, 13, 14 )
				),
				dx = c( 1, 0.75, 0.75, 0.75, 1, 0.75, 0.75 )
			)
		)
	)
)

point.sets$door2 = point.sets$door
point.sets$door2$data[7,1] = 3 * twopi / 4
point.sets$door2$name = "There's somebody at the door (simple)"

crossing.points = point.sets[['door']]

weighting = 0.5^(seq( from = 0, to = (number_of_harmonics-1)*2, by = 2 ))
z_0 = fourier.expand( crossing.points$data, number_of_harmonics, weighting = weighting )

layout( matrix( 1, ncol = 1 ))
plot.it( z_0, crossing.points$data, weighting = weighting )
mtext( crossing.points$name, 3, line = 1, cex = 2 )
print( tibble::tibble(
	harmonic = 1:number_of_harmonics,
	sin = sprintf( "%.4f", z_0[1:number_of_harmonics]*weighting ),
	cos = sprintf( "%.4f", z_0[number_of_harmonics+(1:number_of_harmonics)]*weighting )
), n = 16 )







this.stuff.is.unused.at.the.moment = function() {
	kernel = nullspace( A )

	map_to_coeffs = function( par, z_0 ) {
		z_0 + rowSums(kernel %*% diag(par))
	}

	log.laplace.density = function(x, rate = 1) { dexp( abs(x), rate = rate, log = TRUE ) + log(0.5) }
	log.normal.density = function(x, sd = 0.01 ) { dnorm( x, mean = 0, sd = sd, log = TRUE ) }

	objective = function( par, z_0, log.prior = log.laplace.density ) {
		sum(
			log.prior( map_to_coeffs( par, z_0 ) )
		)
	}

	objective2 = function( par, z_0, exponent = 1/100 ) {
		-sum(
			(abs(map_to_coeffs( par, z_0 ))^exponent),
			na.rm = T
		)
	}

	optimised = optim(
		par = rep( 0, ncol( kernel )),
		fn = function( par ) { objective2( par, z_0 ) }, #, log.prior = log.normal.density ) },
		control = list(
			fnscale = -1,
			trace = TRUE,
			temp = 100
		),
		method = "BFGS"
		#method = "Nelder-Mead"
		#method = "SANN"
	)
	optimised$z = map_to_coeffs( optimised$par, z_0 )

	print(
		tibble::tibble(
			min_norm = z_0, optimised = optimised$z
		)
	)

	ideal = c( 0, 1, rep( 0, 14 ))
	sum(ideal^(1/100))
	sum(z_0^(1/100), na.rm = T)
}
